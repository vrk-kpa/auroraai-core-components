import styled from "styled-components"
import { suomifiDesignTokens } from "suomifi-design-tokens"
import { breakpoints } from "../../breakpoints"
import "react-tabs/style/react-tabs.css"

export const TabsContainer = styled.div`
  width: 100%;
  max-width: 768px;
  margin-top: 60px;

  .react-tabs {
    .auroraai-about-content {
      padding: 30px;
    }
    > ul {
      margin: 0;
      border-bottom: 1px solid ${suomifiDesignTokens.colors.depthLight1};

      li {
        background: inherit;
        border: none;
        border-radius: none;
        font-size: 14px;
        text-transform: uppercase;
        font-weight: 600;
        height: 40px;
        margin-right: 0;
        color: ${suomifiDesignTokens.colors.depthDark1};

        &.react-tabs__tab--selected {
          color: ${suomifiDesignTokens.colors.blackBase};
          border-bottom: 5px solid ${suomifiDesignTokens.colors.highlightBase};
        }
      }
    }

    @media (max-width: ${breakpoints.sm}) {
      > ul {
        border-bottom: none;

        li.react-tabs__tab--selected {
          border-radius: 0;
          border-left: 5px solid ${suomifiDesignTokens.colors.highlightBase};
          border-bottom: none;
        }
      }
    }
  }
`
