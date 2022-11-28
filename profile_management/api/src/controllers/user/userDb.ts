import { UUID } from "io-ts-types"
import { ITask } from "pg-promise"
import { Language } from "shared/schemas"
import { ServiceAttributes } from "shared/util/attributes"

// Get services where user has actually stored some attributes
export async function selectAttributeSourceServicesByUsername(
  tx: ITask<unknown>,
  username: string
): Promise<ServiceAttributes[]> {
  return tx.manyOrNone(
    `
    SELECT
      aurora_ai_service_id AS "id",
      ARRAY_AGG(attribute) as "attributes"
    FROM attribute_source
    WHERE username = $/username/
    GROUP BY aurora_ai_service_id
  `,
    {
      username,
    }
  )
}

export async function selectUsersWithPasswordUnchangedSince(
  tx: ITask<unknown>,
  noOfDays: number
): Promise<{ username: UUID; notificationLanguage: Language }[]> {
  return tx.manyOrNone(
    `
    SELECT username, notification_language as "notificationLanguage" 
    FROM password_change 
    WHERE set_time+'$/noOfDays/ day'::interval < now()
  `,
    { noOfDays }
  )
}

export async function selectPasswordChangeInfo(
  tx: ITask<unknown>
): Promise<
  { username: UUID; notificationLanguage: Language; setTime: Date }[]
> {
  return tx.manyOrNone(
    `
    SELECT username, notification_language as "notificationLanguage", set_time as "setTime" 
    FROM password_change 
  `
  )
}

export async function selectUserPasswordChangeInfo(
  tx: ITask<unknown>,
  username: UUID
): Promise<{ setTime: Date } | null> {
  return tx.oneOrNone(
    `
    SELECT set_time AS "setTime"
    FROM password_change 
    WHERE username = $/username/
  `,
    { username }
  )
}

export async function upsertPasswordSetDate(
  tx: ITask<unknown>,
  username: string,
  notificationLanguage: string
): Promise<void> {
  const timestamp = new Date()
  await tx.none(
    `
      INSERT into password_change (username, set_time, notification_language) VALUES ($/username/, $/timestamp/, $/notificationLanguage/)
      ON CONFLICT (username) DO UPDATE SET set_time = $/timestamp/, notification_language = $/notificationLanguage/
    `,
    {
      username,
      timestamp,
      notificationLanguage,
    }
  )
}

export async function deletePasswordSetDates(
  tx: ITask<unknown>,
  usernames: UUID[]
): Promise<void> {
  await tx.batch(
    usernames.map((username) =>
      tx.none(
        `
        DELETE from password_change 
        WHERE username = $/username/
      `,
        {
          username,
        }
      )
    )
  )
}
