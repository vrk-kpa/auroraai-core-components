import { ironSession } from "iron-session/express"
import { IronSessionOptions } from "iron-session"
import { Request, Response, NextFunction, RequestHandler } from "express"
import { AuthenticatedRequest } from "../util/requestHandler"
import { getSecret } from "../util/secrets"
import { Token } from "../types"
import { config } from "../config"
declare module "iron-session" {
  interface IronSessionData {
    access: Token
    refresh?: Token
  }
}

const cookieName = config.profile_management_cookie_name ?? ""

const defaultOptions: IronSessionOptions = {
  cookieName,
  password: "",
  cookieOptions: {
    secure: config.profile_management_secure_cookies != "false",
    httpOnly: true,
  },
}

const getPassword = () => getSecret("Profile_Management_Cookie_Password")

export const SessionMiddleware =
  (): RequestHandler =>
  async (
    req: Request & Partial<AuthenticatedRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const password = (await getPassword()) || ""

    const options = { ...defaultOptions, password }

    const ironSessionMiddleware = ironSession(options)

    return ironSessionMiddleware(req, res, next)
  }
