import * as t from "io-ts"
import { ChallengeType } from "../../cognito-types/CognitoChallenge"
import { Nullable } from "../types/Nullable"

export const RespondToAuthChallengeRequest = t.type({
  session: Nullable(t.string),
  challenge: t.union([
    t.type({
      type: t.literal(ChallengeType.PASSWORD_VERIFIER),
      parameters: t.type({
        username: t.string,
        secretBlock: t.string,
        signature: t.string,
        timestamp: t.string,
      }),
    }),
    t.type({
      type: t.literal(ChallengeType.NEW_PASSWORD_REQUIRED),
      parameters: t.type({
        username: t.string,
        newPassword: t.string,
      }),
    }),
  ]),
})

export type RespondToAuthChallengeRequest = t.TypeOf<
  typeof RespondToAuthChallengeRequest
>
