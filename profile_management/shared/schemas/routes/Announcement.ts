import * as t from "io-ts"
import { TranslatableString } from "../types"

export const AnnouncementRequest = t.type({
  announcementTitle: TranslatableString,
  announcementDescription: TranslatableString,
  announcementStart: t.string,
  announcementEnd: t.string,
})

export type AnnouncementRequest = t.TypeOf<typeof AnnouncementRequest>
