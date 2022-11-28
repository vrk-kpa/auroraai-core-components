import crypto from "crypto"

/**
 * The CSRF token is valid for 24 hours. It is generated
 * by creating 32 random bytes and concatenating these
 * bytes with the current UNIX timestamp in unsigned 32-bit
 * integer form, and the hmac-sha1 value of the random bytes
 * and the timestamp. The HMAC secret is only known to the
 * server. When the CSRF token is validated, the HMAC hash
 * is checked and that the timestamp is within 24 hours.
 */

const csrfKey = Buffer.from(
  process.env.CSRF_KEY ??
    "0f1a7e3232f3d4823243e01c140a457d74eeacd1536fc62f0f8e0a5f49cd506e",
  "hex"
)

export const generateCsrfToken = (): string => {
  const random = crypto.pseudoRandomBytes(32)
  const hmac = crypto.createHmac("sha1", csrfKey)
  const timestamp = Buffer.alloc(4)
  timestamp.writeUInt32BE(Math.floor(Date.now() / 1000))

  const data = Buffer.concat([random, timestamp])

  return Buffer.concat([data, hmac.update(data).digest()]).toString("base64")
}

export const checkCsrfToken = (value: string): boolean => {
  try {
    const buffer = Buffer.from(value, "base64")

    if (buffer.length !== 32 + 4 + 20) return false

    const randomWithTimestamp = buffer.slice(0, 32 + 4)
    const timestamp = buffer.readUInt32BE(32)
    const hash = buffer.slice(32 + 4)

    const hmac = crypto.createHmac("sha1", csrfKey)

    return (
      hash.equals(hmac.update(randomWithTimestamp).digest()) &&
      Math.floor(Date.now() / 1000) - timestamp < 24 * 60 * 60
    )
  } catch (e) {
    return false
  }
}
