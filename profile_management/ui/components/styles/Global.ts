import { createGlobalStyle } from "styled-components"
import { suomifiDesignTokens } from "suomifi-design-tokens"

export const Global = createGlobalStyle`
  * {
    font-family: "Source Sans Pro", "Helvetica Neue", "Arial", sans-serif;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
  }

  html,
  body {
    padding: 0;
    margin: 0;
    background-color: ${suomifiDesignTokens.colors.depthLight3};
    min-height: 100%;
    height: 100%;
    font-size: 18px;
  }

  #__next {
    height: 100%;
  }

  p {
    margin: 0;
  }

  .fi-status-text.fi-status-text--hasContent {
    margin-top: ${suomifiDesignTokens.spacing.s};
    display: block;
  }

  pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 13px;
    display: inline;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .fi-modal_overlay {
    padding-left: ${suomifiDesignTokens.spacing.m};
    padding-right: ${suomifiDesignTokens.spacing.m};
  }
`
