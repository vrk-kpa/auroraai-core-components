import { ITask } from "pg-promise"
import { UUID } from "io-ts-types/UUID"
import { NotFoundError } from "../../util/errors/ApiErrors"
import { Attributes } from "shared/schemas"

export async function selectSessionAttributes(
  tx: ITask<unknown>,
  accessToken: Buffer
): Promise<Attributes> {
  const result = await tx.oneOrNone<{ sessionAttributes: Attributes }>(
    `
    SELECT session_attributes AS "sessionAttributes"
    FROM access_token
    INNER JOIN session_attributes
    ON session_attributes_id = session_attributes.id
    WHERE access_token = $/accessToken/
    AND expiration_time >= NOW()
  `,
    {
      accessToken,
    }
  )

  if (!result?.sessionAttributes) {
    throw new NotFoundError("Access token not found")
  }

  return result.sessionAttributes
}

export async function insertSessionAttributes(
  tx: ITask<unknown>,
  sessionAttributes: Attributes
): Promise<UUID> {
  const { sessionAttributesId } = await tx.one<{ sessionAttributesId: UUID }>(
    `
    INSERT INTO session_attributes (session_attributes)
    VALUES ($/sessionAttributes/)
    RETURNING id AS "sessionAttributesId"
  `,
    {
      sessionAttributes,
    }
  )

  return sessionAttributesId
}

export async function insertAccessToken(
  tx: ITask<unknown>,
  accessToken: Buffer,
  sessionAttributesId: UUID,
  auroraAIServiceId: UUID
): Promise<void> {
  await tx.none(
    `
    INSERT INTO access_token (access_token, session_attributes_id, aurora_ai_service_id)
    VALUES ($/accessToken/, $/sessionAttributesId/, $/auroraAIServiceId/)
  `,
    {
      accessToken,
      sessionAttributesId,
      auroraAIServiceId,
    }
  )
}

export async function deleteExpiredSessionAttributes(
  tx: ITask<unknown>
): Promise<void> {
  await tx.none(
    `
      DELETE FROM session_attributes
      USING access_token
      WHERE access_token.expiration_time < NOW()
        AND access_token.session_attributes_id = session_attributes.id;
  `
  )
}
