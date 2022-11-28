import * as React from "react"
import { Block, Heading, suomifiDesignTokens } from "suomifi-ui-components"
import { SessionTransferReceiver } from "./SessionTransferReceiver"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import { OAuthHome } from "./OAuthHome"
import { Home } from "./Home"

export function App() {
  return (
    <Router basename="/mock-services">
      <Block margin="m" variant="main">
        <Heading
          variant="h1"
          style={{ marginBottom: suomifiDesignTokens.spacing.m }}
        >
          Mock service {(window as any).mockInstanceNumber ?? ""}
        </Heading>

        <Switch>
          <Route
            path="/:instanceId/:locale?/oauth-home"
            component={OAuthHome}
          />
          <Route
            exact path="/:instanceId/:locale?/"
            component={Home}
          />
          <Route path="/:instanceId/:locale?/service">
            <SessionTransferReceiver />
          </Route>
          <Route path="/:instanceId/:locale?/">Not found</Route>
        </Switch>
      </Block>
    </Router>
  )
}
