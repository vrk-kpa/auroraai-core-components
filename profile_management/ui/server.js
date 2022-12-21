const express = require("express")
const next = require("next")
const healthcheck = require("express-healthcheck")

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== "production"
const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
  const expressApp = express()
  expressApp.disable("x-powered-by")
  expressApp.use("/healthcheck", healthcheck())

  expressApp.all("*", (req, res) => handle(req, res))

  const server = expressApp.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })

  server.keepAliveTimeout = 95 * 1000 // 95 seconds. This must be bigger than the ALB idle_timeout
})
