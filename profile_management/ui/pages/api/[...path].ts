import { createProxyMiddleware } from "http-proxy-middleware"
import type { Request, Response } from "express"
import { parseCookieValue } from "../../utils/cookie"
import { checkCsrfToken } from "../../utils/csrf"
import getConfig from "next/config"

const { serverRuntimeConfig } = getConfig()

/**
 * This can't be done with rewrites as we need to remove
 * the access-control-allow-origin header. We also verify
 * the CSRF token here, although that could be done API-
 * side as well.
 */

const apiProxy = createProxyMiddleware({
  target: `${
    serverRuntimeConfig.config.profile_management_api_url ??
    "http://profile-management-api"
  }`,
  changeOrigin: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pathRewrite: function (path, _) {
    return path.includes("api/config")
      ? path.replace("/api/", "/")
      : path.replace("/api/", "/v1/user/")
  },
  xfwd: true,
  onProxyRes(proxyRes) {
    delete proxyRes.headers["access-control-allow-origin"]
  },
  onError(err, __, res) {
    console.error(err)

    res.statusCode = 502
    res.end(JSON.stringify({ error: "ServiceUnavailable" }))
  },
  logLevel: "error",
})

const requestHandler = (req: Request, res: Response): void => {
  const csrfToken = parseCookieValue("csrfToken", req.headers.cookie ?? "")

  if (!csrfToken || csrfToken !== req.headers["x-csrf-token"]) {
    res.status(403).send({ error: "Forbidden" })
    return
  }

  if (csrfToken.length < 10 || !checkCsrfToken(csrfToken)) {
    // too weak
    res.status(403).send({ error: "Forbidden" })
    return
  }

  apiProxy(req, res, () => {
    res.status(502).send({ error: "ServiceUnavailable" })
  })
}

export default requestHandler

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}
