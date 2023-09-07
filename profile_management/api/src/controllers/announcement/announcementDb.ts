import { UUID } from "io-ts-types"
import { ITask } from "pg-promise"
import { TranslatableString } from "shared/schemas"

export async function insertAnnouncement(
  tx: ITask<unknown>,
  title: TranslatableString,
  description: TranslatableString,
  start: Date,
  end: Date
): Promise<void> {
  await tx.none(
    `INSERT into
      announcement (
        announcement_title,
        announcement_description,
        announcement_start,
        announcement_end
      )
    VALUES
      ($/title/, $/description/, $/start/, $/end/)
    `,
    {
      title,
      description,
      start,
      end,
    }
  )
}

export type AnnouncementType = {
  id: UUID
  announcementTitle: TranslatableString
  announcementDescription: TranslatableString
  announcementStart: Date
  announcementEnd: Date
}

export async function selectAnnouncementsBetweenDates(
  tx: ITask<unknown>,
  start: Date,
  end: Date
): Promise<AnnouncementType[]> {
  return await tx.manyOrNone(
    `SELECT
      id,
      announcement_title as "announcementTitle",
      announcement_description as "announcementDescription",
      announcement_start as "announcementStart",
      announcement_end as "announcementEnd"
    FROM
      announcement
    WHERE announcement_start BETWEEN $/start/ AND $/end/
    OR announcement_end BETWEEN $/start/ AND $/end/`,
    {
      start,
      end,
    }
  )
}

export async function selectAnnouncement(
  tx: ITask<unknown>,
  id: UUID
): Promise<AnnouncementType | null> {
  return await tx.oneOrNone(
    `SELECT
      id,
      announcement_title as "announcementTitle",
      announcement_description as "announcementDescription",
      announcement_start as "announcementStart",
      announcement_end as "announcementEnd"
    FROM
      announcement
    WHERE id = $/id/`,
    {
      id,
    }
  )
}

export async function selectActiveAnnouncements(
  tx: ITask<unknown>
): Promise<AnnouncementType[]> {
  return await tx.manyOrNone(
    `SELECT
      id,
      announcement_title as "announcementTitle",
      announcement_description as "announcementDescription",
      announcement_start as "announcementStart",
      announcement_end as "announcementEnd"
    from
      announcement
    WHERE
      now() >= announcement_start
      AND now() <= announcement_end`,
    {}
  )
}

export async function selectAnnouncements(
  tx: ITask<unknown>
): Promise<AnnouncementType[]> {
  return await tx.manyOrNone(
    `SELECT
      id,
      announcement_title as "announcementTitle",
      announcement_description as "announcementDescription",
      announcement_start as "announcementStart",
      announcement_end as "announcementEnd"
    FROM
     announcement
    `
  )
}

export async function deleteAnnouncement(
  tx: ITask<unknown>,
  id: UUID
): Promise<void> {
  await tx.none(
    `
      DELETE FROM announcement
      WHERE id = $/id/
    `,
    {
      id,
    }
  )
}

export async function updateAnnouncement(
  tx: ITask<unknown>,
  id: UUID,
  title: TranslatableString,
  description: TranslatableString,
  start: Date,
  end: Date
): Promise<void> {
  await tx.none(
    `UPDATE
      announcement
    SET
      announcement_title = $/title/,
      announcement_description = $/description/,
      announcement_start = $/start/,
      announcement_end = $/end/
    WHERE
      id = $/id/
    `,
    {
      title,
      description,
      start,
      end,
      id,
    }
  )
}
