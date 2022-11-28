import express from "express"
import { OauthAccessTokenMiddleware } from "../../middlewares/OauthAccessTokenMiddleware"
import { handleOauthRequest } from "../../util/requestHandler"
import { generateUUIDForOauthClient } from "../../util/uuid"

export const oauthAccessTokenRouter = express.Router()

oauthAccessTokenRouter.get(
  "/userinfo",
  OauthAccessTokenMiddleware("openid"),
  handleOauthRequest(async (req) => ({
    sub: await generateUUIDForOauthClient(req.username, req.clientId),
    scope: req.scopes.join(" "),
  }))
)
