import * as t from "io-ts"

export const VerifyEmailChangeRequest = t.type({
  token: t.string,
})

export type VerifyEmailChangeRequest = t.TypeOf<typeof VerifyEmailChangeRequest>
