import { AppPropsType, RenderPageResult } from "next/dist/shared/lib/utils"
import Document, {
  DocumentContext,
  DocumentInitialProps,
  Html,
  Main,
  NextScript,
  Head,
} from "next/document"
import { NextRouter } from "next/router"
import { ServerStyleSheet } from "styled-components"
import { getCookieServerSide, setCookiesServerSide } from "../utils/cookie"
import { checkCsrfToken, generateCsrfToken } from "../utils/csrf"
import { cspHashOf, serializeCsp } from "../utils/csp"

export default class AAIDocument extends Document<{ csrfToken: string }> {
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps & { csrfToken: string }> {
    let csrfToken = getCookieServerSide("csrfToken", ctx)

    if (!csrfToken || !checkCsrfToken(csrfToken)) {
      csrfToken = generateCsrfToken()

      setCookiesServerSide(ctx, [
        `csrfToken=${csrfToken};path=/;sameSite=Strict;expires=1`,
      ])
    }

    const sheet = new ServerStyleSheet()
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = (): RenderPageResult | Promise<RenderPageResult> =>
        originalRenderPage({
          enhanceApp:
            (App) =>
            (props: AppPropsType<NextRouter>): JSX.Element =>
              sheet.collectStyles(<App {...props} />),
        })

      const initialProps = await Document.getInitialProps(ctx)
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
        csrfToken,
      }
    } finally {
      sheet.seal()
    }
  }

  render(): JSX.Element {
    const csrfScript = `window.csrfToken = "${this.props.csrfToken}"`

    const inlineHash = cspHashOf(NextScript.getInlineScriptSource(this.props))
    const csrfHash = cspHashOf(csrfScript)

    return (
      <Html>
        <Head>
          <meta
            httpEquiv="Content-Security-Policy"
            content={serializeCsp({
              "default-src": "'self'",
              "style-src": [
                "'self'",
                "https://fonts.googleapis.com",
                "'unsafe-inline'",
              ],
              "img-src": ["'self'", "data:"],
              "font-src": "https://fonts.gstatic.com",
              "connect-src": "'self'",
              "prefetch-src": "'self'",
              "base-uri": "'self'",
              "object-src": "'none'",
              "script-src": ["'self'", inlineHash, csrfHash].concat(
                process.env.NODE_ENV === "production" ? [] : ["'unsafe-eval'"]
              ),
            })}
          />

          <meta
            name="description"
            content="AuroraAI-verkko on julkisen hallinnon sähköisen asioinnin tukipalvelu."
          />

          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/static/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/static/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/static/favicon-16x16.png"
          />
          <link
            rel="manifest"
            href="/static/site.webmanifest"
            crossOrigin="use-credentials"
          />
          <link
            rel="mask-icon"
            href="/static/safari-pinned-tab.svg"
            color="#000000"
          />
          <link rel="shortcut icon" href="/static/favicon.ico" />
          <meta name="theme-color" content="#ffffff" />

          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600&display=swap"
          />
        </Head>
        <body>
          <Main />

          <script
            dangerouslySetInnerHTML={{
              __html: csrfScript,
            }}
          />
          <NextScript />
        </body>
      </Html>
    )
  }
}
