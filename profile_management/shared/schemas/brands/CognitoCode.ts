import { withMessage } from "io-ts-types/withMessage"
import * as t from "io-ts"

export interface CognitoCodeBrand {
  readonly CognitoCode: unique symbol
}

export const CognitoCode = withMessage(
  t.brand(
    t.string,
    (s: string): s is t.Branded<string, CognitoCodeBrand> =>
      /^[0-9]{6}$/.test(s),
    "CognitoCode"
  ),
  (input) => `Cognito codes must be 6-digit strings, got: ${input}`
)

export type CognitoCode = t.TypeOf<typeof CognitoCode>
