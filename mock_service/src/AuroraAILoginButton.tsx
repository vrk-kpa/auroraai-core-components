import * as React from "react"
import { suomifiDesignTokens } from "suomifi-ui-components"

export function AuroraAILoginButton(
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement 
  > & {locale: string | undefined}
) {
  return (
    <button
      id="aurora-ai-login"
      onClick={() => {
        window.location.href = `oauth/authorize/auroraai?locale=${props.locale}`
      }}
      {...props}
      style={{
        backgroundColor: suomifiDesignTokens.colors.whiteBase,
        border: `1px solid ${suomifiDesignTokens.colors.depthLight1}`,
        borderRadius: "4px",
        display: "flex",
        fontFamily: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif',
        padding: 0,
        fontSize: "16px",
        cursor: "pointer",
        alignItems: "stretch",
        ...props.style,
      }}
    >
      <div
        style={{
          borderRight: `1px solid ${suomifiDesignTokens.colors.depthLight1}`,
          padding: suomifiDesignTokens.spacing.xs,
          display: "flex",
          alignItems: "center",
        }}
      >
        <svg
          version="1.0"
          xmlns="http://www.w3.org/2000/svg"
          width="25px"
          height="25px"
          viewBox="0 0 700 700"
        >
          <path d="M232.9 101.8c-2.6.5-3.6 3.8-6.9 23.7l-3.6 21-.9 5-1 5.5-1 6-3.5 20a1697 1697 0 00-4.5 26 14798.3 14798.3 0 00-11 63l-1 6c-1.3 7.6-1.9 10.7-2 12l-.8 4.5A632.1 632.1 0 01193 315l-2.5 14.5-1.1 6.5-2.9 17-1 5c-.2.8-.7 4-1 7-.4 3-.8 5.7-1 6-.2.3-1.5 7.3-2.9 15.5l-3 17.1-1.1 7.5c-.4 3-.9 5.7-1.1 6-.2.4-1.3 6-2.3 12.5l-2.5 14.4-3 17.5-10.1 58-1.5 8.5-3 17-1.5 9a197.7 197.7 0 01-2 11.3l-1 6.8c-1.2 7.7-1.9 7.5 37.4 7.5 38.5-.1 36.5.3 37.5-8.1l1-7 1-6.5 1-7 2.1-13.8 2-13 .9-6.7 1.1-6.5.9-6 1.1-7.5 2-13 1-7a371.8 371.8 0 012.4-15.6c.1-1.4 3.3-1.6 28.6-1.6 19.9 0 28.5.3 28.5 1.1l1.1 8.1 1.4 10.9c.3 2.1.6 4.6.9 5.5.3.9.7 4.3 1.1 7.6l1 8.5c.5 3.1 1.2 7.9 2 14.5l1 6.5c.3.8.7 4 1 7.1l.9 7.6c.3 1.1.7 4.4 1.1 7.4.3 3 1 7.6 1.5 10.4.8 4.8 2.4 16.6 2.5 19.2 0 .7.8 2 1.8 3 1.6 1.7 4.6 1.8 35.8 1.8a236 236 0 0035.5-1c2.1-1.4 2-5.7-.2-16.7l-.9-5.5c-.4-3-1.2-8.2-2-12.3l-2-12-9-55a4873.1 4873.1 0 01-10-60.5l-2.2-13-2.3-14c-1-6.1-2.2-13-2.5-15.5-.3-2.5-.8-5.2-1-6l-.9-5.3c-.9-5.8-1.7-10.8-2.2-13.1l-2.5-15.1a930 930 0 00-4.4-26.9l-1-6.1-1.5-9.5-1.5-9-1.5-9-2.5-15-1.9-11.5-2-12-3-19-1.1-6-1.1-5.9-1-7.5c-.3-3.1-.8-5.9-1-6.2-.3-.5-.8-3.5-3-17.3l-1-6-1-6.6a40 40 0 00-.9-5c-.2-.3-.7-3.3-1-6.5-.4-3.3-.9-6.3-1.1-6.6-.2-.4-.6-2.6-.9-5l-1-6.9-1.9-10.5c-2.5-16.6-2.8-17.4-4.9-18.2-2.1-.6-71.4-1.2-74.8-.5zm38.5 166.7a193.5 193.5 0 002 15.5l1 6.5 1.1 8.5c.4 3.6.8 6.7 1 7 .1.3.6 3.6.9 7.5l1.1 8.5 1 6.5 1 7.5.9 7 1.5 11.5 2.7 19 .9 6.5 1 7.3.6 4.7-18.8-.2c-20.9-.3-19.1.4-17.9-7.3l1.2-8 1-7c.3-1.1.7-3.8.9-6l2.6-17a1462.3 1462.3 0 003.4-22.5l1.5-9.5c1.2-8.5 1.7-11.8 2.4-15l1.1-8c.3-3.2.8-6.2 1-6.5.1-.3.6-3.2 1-6.5a141.8 141.8 0 012.9-16.4c.2.2.7 3.1 1 6.4zM455.8 101.9c-.7.2-1.7 1-2.3 1.8-.7.9-1 81.3-1 236.8.1 223.1.2 235.6 1.8 237.2 1.6 1.6 4.7 1.8 34 1.9 25.7.1 32.7-.2 34.5-1.3l2.2-1.3V340.6c0-217.8-.1-236.5-1.6-237.7-1.3-1.1-8.3-1.4-34-1.4a797 797 0 00-33.6.4z" />
        </svg>
      </div>
      <div
        style={{
          padding: suomifiDesignTokens.spacing.s,
          paddingTop: suomifiDesignTokens.spacing.xs,
          paddingBottom: suomifiDesignTokens.spacing.xs,
          display: "flex",
          alignItems: "center",
        }}
      >
        Kirjaudu sisään AuroraAI-tilillä
      </div>
    </button>
  )
}
