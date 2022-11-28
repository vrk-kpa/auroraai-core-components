import * as t from "io-ts"

export const InitiateAuthRequest = t.type({
  username: t.string,
  srpA: t.string,
})

export type InitiateAuthRequest = t.TypeOf<typeof InitiateAuthRequest>
