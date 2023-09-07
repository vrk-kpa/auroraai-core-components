import base64url from "base64url"
import { Token } from "../types"

export const splitToken = (token: string): string[] => token.split(".")

export const createTokenObject = (tokenParts: string[]): Token => {
  const [header, payload, signature] = tokenParts

  return { header, payload, signature }
}

export const decode = (value: string): string => base64url.decode(value)
export const encode = (value: string): string => base64url.encode(value)

export const decodeTokenObject = (token: Token): Token => ({
  ...token,
  header: decode(token.header),
  payload: decode(token.payload),
})

export const encodeTokenObject = (token: Token): Token => ({
  ...token,
  header: encode(token.header),
  payload: encode(token.payload),
})

export const combineTokenParts = ({
  header,
  payload,
  signature,
}: Token): string => `${header}.${payload}.${signature}`

export const createAndDecodeTokenObjectFromString = (token: string): Token => {
  const tokenParts = splitToken(token)
  const decodedToken = createTokenObject(tokenParts)

  return decodeTokenObject(decodedToken)
}

export const encodeTokenObjectToString = (token: Token): string => {
  const enecodedToken = encodeTokenObject(token)

  return combineTokenParts(enecodedToken)
}
