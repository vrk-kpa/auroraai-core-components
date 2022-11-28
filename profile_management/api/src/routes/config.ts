import express from "express"
import { environment } from "../config"
import { announcementController } from "../controllers/announcement/announcementService"

export const configRouter = express.Router()

configRouter.get("/", async (_req, res, _next) => {
  const config = {
    environment,
    announcements: await announcementController.getActiveAnnouncements(),
  }
  res.json(config)
})
