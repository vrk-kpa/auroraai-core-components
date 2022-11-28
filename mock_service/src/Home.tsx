import * as React from "react"
import { suomifiDesignTokens } from "suomifi-ui-components"
import { AuroraAILoginButton } from "./AuroraAILoginButton"

const searchParams = new URLSearchParams(window.location.search)

export function Home(props: any) {
  return (
    <div>
      {searchParams.has("oauth-fail") && (
        <div
          style={{
            backgroundColor: suomifiDesignTokens.colors.alertLight1,
            borderLeft: `4px solid ${suomifiDesignTokens.colors.alertBase}`,
            padding: suomifiDesignTokens.spacing.l,
            fontWeight: "bold",
            display: "flex",
            textAlign: "center",
          }}
        >
          {searchParams.get("oauth-fail") === "2"
            ? "Et antanut palvelulle lupaa hakea tietoa iästäsi."
            : "Kirjautuminen AuroraAI-tilillä epäonnistui. Yritä uudelleen."}
        </div>
      )}

      <AuroraAILoginButton
        locale={props.match.params.locale ?? undefined}
        style={{
          marginTop: suomifiDesignTokens.spacing.m,
        }}
      />

      <p id="page-locale" style={{fontSize: "10pt"}}>
        locale: {props.match.params.locale ?? "fi"}
      </p>
    </div>
  )
}
