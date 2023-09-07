import { TranslatableString } from "shared/schemas"
import { db } from "../../db"
import {
  insertAnnouncement,
  selectAnnouncementsBetweenDates,
  selectAnnouncements,
  selectActiveAnnouncements,
  deleteAnnouncement,
  updateAnnouncement,
  selectAnnouncement,
  AnnouncementType,
} from "./announcementDb"
import { UUID } from "io-ts-types/UUID"

async function addAnnouncement(
  title: TranslatableString,
  description: TranslatableString,
  start: Date,
  end: Date
): Promise<void> {
  await db.task((t) => insertAnnouncement(t, title, description, start, end))
}

async function getAnnouncementsBetweenDates(
  start: Date,
  end: Date
): Promise<AnnouncementType[]> {
  return await db.task((t) => selectAnnouncementsBetweenDates(t, start, end))
}

async function getActiveAnnouncements(): Promise<AnnouncementType[]> {
  return await db.task((t) => selectActiveAnnouncements(t))
}

async function getAnnouncements(): Promise<AnnouncementType[]> {
  return await db.task((t) => selectAnnouncements(t))
}

async function removeAnnouncement(id: UUID): Promise<void> {
  await db.task((t) => deleteAnnouncement(t, id))
}

async function modifyAnnouncement(
  id: UUID,
  title: TranslatableString,
  description: TranslatableString,
  start: Date,
  end: Date
): Promise<void> {
  await db.task((t) =>
    updateAnnouncement(t, id, title, description, start, end)
  )
}

async function getAnnouncement(id: UUID): Promise<AnnouncementType | null> {
  return await db.task((t) => selectAnnouncement(t, id))
}

export const announcementController = {
  addAnnouncement,
  getAnnouncementsBetweenDates,
  getAnnouncements,
  getActiveAnnouncements,
  removeAnnouncement,
  modifyAnnouncement,
  getAnnouncement,
}
