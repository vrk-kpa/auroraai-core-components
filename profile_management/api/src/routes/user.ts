import { Router, Request } from "express"
import {
  handleAuthenticatedRequest,
  handleRequest,
} from "../util/requestHandler"
import { UserMiddleware } from "../middlewares/UserMiddleware"
import { SessionMiddleware } from "../middlewares/SessionMiddleware"
import {
  setAuthTokens,
  userControllerAnonymous,
  userControllerAuthenticated,
} from "../controllers/user/user"
import cookieParser from "cookie-parser"
import { validator } from "../middlewares/ValidatorMiddleware"
import * as schemas from "shared/schemas"

export const userRouterV1 = Router()

userRouterV1.use(cookieParser())
userRouterV1.use(SessionMiddleware())

userRouterV1.get(
  "/email_available",
  validator.query(schemas.CheckEmailAvailabilityRequest),
  handleRequest((req) => userControllerAnonymous.emailAvailable(req.query))
)

userRouterV1.post(
  "/initiate_auth",
  validator.body(schemas.InitiateAuthRequest),
  handleRequest(async (req: Request) => {
    const authResponse = await userControllerAnonymous.initiateAuth(req.body)

    if ("accessToken" in authResponse) {
      await setAuthTokens(
        req,
        authResponse.accessToken,
        authResponse.refreshToken
      )
      return
    }

    return authResponse
  })
)

userRouterV1.post(
  "/respond_to_auth_challenge",
  validator.body(schemas.RespondToAuthChallengeRequest),
  handleRequest(async (req: Request) => {
    const authResponse = await userControllerAnonymous.respondToAuthChallenge(
      req.body
    )

    if ("accessToken" in authResponse) {
      await setAuthTokens(
        req,
        authResponse.accessToken,
        authResponse.refreshToken
      )
      return
    }

    return authResponse
  })
)

userRouterV1.post(
  "/sign_up",
  validator.body(schemas.RegisterRequest),
  handleRequest((req) => userControllerAnonymous.signUp(req.body))
)

userRouterV1.post(
  "/sign_up_resend_confirm",
  validator.body(schemas.ResendSignUpConfirmRequest),
  handleRequest((req) => userControllerAnonymous.signUpResendConfirm(req.body))
)

userRouterV1.post(
  "/sign_up_confirm",
  validator.body(schemas.ConfirmSignUpRequest),
  handleRequest((req) => userControllerAnonymous.signUpConfirm(req.body))
)

userRouterV1.post(
  "/forgot_password",
  validator.body(schemas.ForgotRequest),
  handleRequest((req) => userControllerAnonymous.forgotPassword(req.body))
)

userRouterV1.post(
  "/reset_password",
  validator.body(schemas.ForgotResetRequest),
  handleRequest((req) => userControllerAnonymous.resetPassword(req.body))
)

const authenticatedRouter = Router()

authenticatedRouter.use(UserMiddleware())

authenticatedRouter.get(
  "/me",
  handleAuthenticatedRequest(
    async (req) =>
      await userControllerAuthenticated.getUserProfile(req.cognitoUser)
  )
)

authenticatedRouter.get(
  "/services",
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.getConnectedServices(req.cognitoUser.username)
  )
)

authenticatedRouter.post(
  "/scope_change_request",
  validator.body(schemas.ScopeChangeRequest),
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.requestScopeChange(
      req.cognitoUser.username,
      req.body
    )
  )
)

authenticatedRouter.post(
  "/change_password",
  validator.body(schemas.ChangePasswordRequest),
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.changePassword(
      req.cognitoUser.accessToken,
      req.body
    )
  )
)

authenticatedRouter.post(
  "/change_email",
  validator.body(schemas.ChangeEmailRequest),
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.changeEmail(req.body)
  )
)

authenticatedRouter.post(
  "/change_email_verify",
  validator.body(schemas.VerifyEmailChangeRequest),
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.changeEmailVerify(req.body)
  )
)

authenticatedRouter.post(
  "/authorize_init",
  validator.body(schemas.InitOauthAuthorization),
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.initOauthAuthorization(
      req.cognitoUser.username,
      req.cognitoUser.authTime,
      req.body
    )
  )
)

authenticatedRouter.post(
  "/authorize",
  validator.body(schemas.OauthAuthorize),
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.oauthAuthorize(
      req.body,
      req.cognitoUser.username,
      req.cognitoUser.authTime
    )
  )
)

authenticatedRouter.post(
  "/deactivate",
  validator.body(schemas.OauthDeactivate),
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.oauthDeactivate(
      req.body,
      req.cognitoUser.username
    )
  )
)

authenticatedRouter.delete(
  "/service",
  validator.body(schemas.RemoveService),
  handleAuthenticatedRequest(async (req) => {
    await userControllerAuthenticated.removeService(
      req.body,
      req.cognitoUser.username
    )
  })
)

authenticatedRouter.get(
  "/services_blocking_deletion",
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.getServicesBlockingDeletion(
      req.cognitoUser.username
    )
  )
)

authenticatedRouter.post(
  "/deactivate_all_services",
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.deactivateAllServices(req.cognitoUser.username)
  )
)

authenticatedRouter.delete(
  "/me",
  handleAuthenticatedRequest((req) =>
    userControllerAuthenticated.deleteUser(
      req.cognitoUser.accessToken,
      req.cognitoUser.username
    )
  )
)

userRouterV1.use(authenticatedRouter)
