import crypto from "crypto"

export const serializeCsp = (
  props: Record<string, string | string[]>
): string =>
  Object.entries(props)
    .map(([k, v]) => `${k} ${Array.isArray(v) ? v.join(" ") : v}`)
    .join("; ")

export const cspHashOf = (text: string): string => {
  const hash = crypto.createHash("sha256")
  hash.update(text)
  return `'sha256-${hash.digest("base64")}'`
}
