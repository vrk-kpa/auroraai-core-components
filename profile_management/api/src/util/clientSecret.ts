import crypto from "crypto"

export const createClientSecret = (): string =>
  crypto.randomBytes(18).toString("hex")
