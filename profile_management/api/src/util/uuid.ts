import { createCipheriv, createDecipheriv } from "crypto"
import { UUID } from "io-ts-types/lib/UUID"
import { getSecret } from "./secrets"

const uuidToBuffer = (uuid: UUID) => Buffer.from(uuid.replace(/-/g, ""), "hex")

const bufferToUUID = (buffer: Buffer) =>
  [
    buffer.slice(0, 4),
    buffer.slice(4, 6),
    buffer.slice(6, 8),
    buffer.slice(8, 10),
    buffer.slice(10, 16),
  ]
    .map((piece) => piece.toString("hex"))
    .join("-") as UUID

/**
 * Generates an UUID specific for the given username (UUID)
 * and service. This allows services to identify to the user
 * even if the user has disconnected the service in the past
 * but services themselves cannot combine information from
 * other services as this UUID is service-specific.
 *
 * If the user disconnects a service and realizes they want
 * to use it again (e.g. in order to remove data if this is
 * the only login method), by making the UUID stay the same
 * (if the service stays the same) the user can access previously
 * stored information (if any).
 */
export const generateUUIDForOauthClient = async (
  username: UUID,
  clientId: UUID
): Promise<UUID> => {
  const key = Buffer.from(
    (await getSecret("Profile_Management_Oauth_Id_Key")) ?? "",
    "hex"
  )

  const cipher = createCipheriv("aes-256-cbc", key, uuidToBuffer(clientId))
  cipher.setAutoPadding(false)

  const buffer = Buffer.concat([
    cipher.update(uuidToBuffer(username)),
    cipher.final(),
  ])

  return bufferToUUID(buffer)
}

/**
 * Reverses the encryption done above.
 *
 * WARNING: the UUID produced from this may not be
 * trusted on its own. It isn't possible to guarantee
 * that the given client ID was used to generate the
 * given UUID. As such, all uses (e.g. database operations)
 * of this UUID should always be accompanied by the
 * client ID to ensure the context stays same.
 */
export const getOriginalUUID = async (
  uuid: UUID,
  clientId: UUID
): Promise<UUID> => {
  const key = Buffer.from(
    (await getSecret("Profile_Management_Oauth_Id_Key")) ?? "",
    "hex"
  )

  const decipher = createDecipheriv("aes-256-cbc", key, uuidToBuffer(clientId))
  decipher.setAutoPadding(false)

  const buffer = Buffer.concat([
    decipher.update(uuidToBuffer(uuid)),
    decipher.final(),
  ])

  return bufferToUUID(buffer)
}
