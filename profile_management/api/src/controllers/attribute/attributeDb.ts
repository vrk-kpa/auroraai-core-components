import { UUID } from "io-ts-types/lib/UUID"
import { ITask } from "pg-promise"

export async function deleteAttributeSources(
  tx: ITask<unknown>,
  username: UUID,
  auroraAIServiceId: UUID,
  attributes: string[]
): Promise<void> {
  await tx.none(
    `
        DELETE FROM attribute_source
        WHERE username = $/username/ AND aurora_ai_service_id = $/auroraAIServiceId/ AND attribute IN ($/attributes:csv/)
      `,
    {
      username,
      auroraAIServiceId,
      attributes,
    }
  )
}

export async function deleteAttributeSourcesByServiceId(
  tx: ITask<unknown>,
  username: UUID,
  auroraAIServiceId: UUID
): Promise<void> {
  await tx.none(
    `
        DELETE FROM attribute_source
        WHERE username = $/username/ AND aurora_ai_service_id = $/auroraAIServiceId/
      `,
    {
      username,
      auroraAIServiceId,
    }
  )
}

export async function insertAttributeDeletion(
  tx: ITask<unknown>,
  deletions: { username: UUID; auroraAIServiceId: UUID }[]
): Promise<void> {
  await tx.batch(
    deletions.map((deletion) =>
      tx.none(
        `
        INSERT into attribute_deletion (username, aurora_ai_service_id)
        VALUES ($/username/, $/auroraAIServiceId/)
        ON CONFLICT DO NOTHING
      `,
        {
          username: deletion.username,
          auroraAIServiceId: deletion.auroraAIServiceId,
        }
      )
    )
  )
}

export async function removePendingAttributeDeletion(
  tx: ITask<unknown>,
  deletions: { username: UUID; auroraAIServiceId: UUID }[]
): Promise<void> {
  await tx.batch(
    deletions.map((deletion) =>
      tx.none(
        `
        DELETE from attribute_deletion 
        WHERE username = $/username/ AND aurora_ai_service_id = $/auroraAIServiceId/
      `,
        {
          username: deletion.username,
          auroraAIServiceId: deletion.auroraAIServiceId,
        }
      )
    )
  )
}

export async function selectPendingAttributeDeletions(
  tx: ITask<unknown>
): Promise<{ username: UUID; auroraAIServiceId: UUID; initiatedTime: Date }[]> {
  return tx.manyOrNone(
    `
      SELECT username, aurora_ai_service_id as "auroraAIServiceId", initiated_time as "initiatedTime"
      FROM attribute_deletion
    `
  )
}

export async function insertAttributeSources(
  tx: ITask<unknown>,
  username: UUID,
  auroraAIServiceId: UUID,
  attributes: string[]
): Promise<void> {
  await tx.batch(
    attributes.map((attribute) =>
      tx.none(
        `
        INSERT INTO attribute_source (username, aurora_ai_service_id, attribute)
        VALUES ($/username/, $/auroraAIServiceId/, $/attribute/)
        ON CONFLICT DO NOTHING
      `,
        {
          username,
          auroraAIServiceId,
          attribute,
        }
      )
    )
  )
}

export async function selectAttributeSources(
  tx: ITask<unknown>,
  username: UUID,
  attributes: string[]
): Promise<{ attribute: string; auroraAIServiceIds: UUID[] }[]> {
  return tx.manyOrNone(
    `
        SELECT
          attribute,
          ARRAY_AGG(attribute_source.aurora_ai_service_id) as "auroraAIServiceIds"
        FROM attribute_source
        LEFT JOIN oauth_token_pair
          ON oauth_token_pair.username = $/username/
            AND oauth_token_pair.aurora_ai_service_id = attribute_source.aurora_ai_service_id
            AND CONCAT('store:', attribute) = ANY(oauth_token_pair.refresh_token_scopes)
            AND oauth_token_pair.refresh_expiration_time > NOW()
        WHERE
          attribute_source.username = $/username/
          AND attribute_source.attribute IN ($/attributes:csv/)
          AND oauth_token_pair.refresh_expiration_time IS NOT NULL
        GROUP BY attribute_source.attribute
      `,
    {
      username,
      attributes,
    }
  )
}

export async function selectAllAttributeSources(
  tx: ITask<unknown>,
  username: UUID
): Promise<{ attribute: string; auroraAIServiceIds: UUID[] }[]> {
  return tx.manyOrNone(
    `
        SELECT
          attribute,
          ARRAY_AGG(attribute_source.aurora_ai_service_id) as "auroraAIServiceIds"
        FROM attribute_source
        LEFT JOIN oauth_token_pair
          ON oauth_token_pair.username = $/username/
            AND oauth_token_pair.aurora_ai_service_id = attribute_source.aurora_ai_service_id
            AND CONCAT('store:', attribute) = ANY(oauth_token_pair.refresh_token_scopes)
            AND oauth_token_pair.refresh_expiration_time > NOW()
        WHERE
          attribute_source.username = $/username/
          AND oauth_token_pair.refresh_expiration_time IS NOT NULL
        GROUP BY attribute_source.attribute
      `,
    {
      username,
    }
  )
}
