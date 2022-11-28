import express from "express"
import { oauthAccessTokenRouter } from "./oauth/oauthAccessToken"
import { oauthAnonymousRouter } from "./oauth/oauthAnonymous"
import { oauthClientRouter } from "./oauth/oauthClient"

export const oauthRouter = express.Router()

oauthRouter.use("/", oauthAnonymousRouter)
oauthRouter.use("/", oauthAccessTokenRouter)
oauthRouter.use("/", oauthClientRouter)
