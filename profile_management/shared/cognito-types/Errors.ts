import * as t from "io-ts"

const CommonErrorNames = t.keyof({
  AccessDeniedException: null,
  IncompleteSignature: null,
  InternalFailure: null,
  InvalidAction: null,
  InvalidClientTokenId: null,
  InvalidParameterCombination: null,
  InvalidParameterValue: null,
  InvalidQueryParameter: null,
  MalformedQueryString: null,
  MissingAction: null,
  MissingAuthenticationToken: null,
  MissingParameter: null,
  NotAuthorized: null,
  OptInRequired: null,
  RequestExpired: null,
  ServiceUnavailable: null,
  ThrottlingException: null,
  ValidationError: null,
})
type CommonErrorNames = t.TypeOf<typeof CommonErrorNames>

const SignupErrorNames = t.keyof({
  CodeDeliveryFailureException: null,
  InternalErrorException: null,
  InvalidEmailRoleAccessPolicyException: null,
  InvalidLambdaResponseException: null,
  InvalidParameterException: null,
  InvalidPasswordException: null,
  InvalidSmsRoleAccessPolicyException: null,
  InvalidSmsRoleTrustRelationshipException: null,
  NotAuthorizedException: null,
  ResourceNotFoundException: null,
  TooManyRequestsException: null,
  UnexpectedLambdaException: null,
  UserLambdaValidationException: null,
  UsernameExistsException: null,
})
type SignupErrorNames = t.TypeOf<typeof SignupErrorNames>

const InitiateAuthErrorNames = t.keyof({
  InternalErrorException: null,
  InvalidLambdaResponseException: null,
  InvalidParameterException: null,
  InvalidSmsRoleAccessPolicyException: null,
  InvalidSmsRoleTrustRelationshipException: null,
  InvalidUserPoolConfigurationException: null,
  NotAuthorizedException: null,
  PasswordResetRequiredException: null,
  ResourceNotFoundException: null,
  TooManyRequestsException: null,
  UnexpectedLambdaException: null,
  UserLambdaValidationException: null,
  UserNotConfirmedException: null,
  UserNotFoundException: null,
})
type InitiateAuthErrorNames = t.TypeOf<typeof InitiateAuthErrorNames>

const RespondToAuthChallengeErrorNames = t.keyof({
  AliasExistsException: null,
  CodeMismatchException: null,
  ExpiredCodeException: null,
  InternalErrorException: null,
  InvalidLambdaResponseException: null,
  InvalidParameterException: null,
  InvalidPasswordException: null,
  InvalidSmsRoleAccessPolicyException: null,
  InvalidSmsRoleTrustRelationshipException: null,
  InvalidUserPoolConfigurationException: null,
  MFAMethodNotFoundException: null,
  NotAuthorizedException: null,
  PasswordResetRequiredException: null,
  ResourceNotFoundException: null,
  SoftwareTokenMFANotFoundException: null,
  TooManyRequestsException: null,
  UnexpectedLambdaException: null,
  UserLambdaValidationException: null,
  UserNotConfirmedException: null,
  UserNotFoundException: null,
})
type RespondToAuthChallengeErrorNames = t.TypeOf<typeof RespondToAuthChallengeErrorNames>


const ResendConfirmationCodeErrorNames = t.keyof({
    CodeDeliveryFailureException: null,
    InternalErrorException: null,
    InvalidEmailRoleAccessPolicyException: null,
    InvalidLambdaResponseException: null,
    InvalidParameterException: null,
    InvalidSmsRoleAccessPolicyException: null,
    InvalidSmsRoleTrustRelationshipException: null,
    LimitExceededException: null,
    NotAuthorizedException: null,
    ResourceNotFoundException: null,
    TooManyRequestsException: null,
    UnexpectedLambdaException: null,
    UserLambdaValidationException: null,
    UserNotFoundException: null,
})
type ResendConfirmationCodeErrorNames = t.TypeOf<typeof ResendConfirmationCodeErrorNames>

const ConfirmSignUpErrorNames = t.keyof(
  {
    AliasExistsException: null,
    CodeMismatchException: null,
    ExpiredCodeException: null,
    InternalErrorException: null,
    InvalidLambdaResponseException: null,
    InvalidParameterException: null,
    LimitExceededException: null,
    NotAuthorizedException: null,
    ResourceNotFoundException: null,
    TooManyFailedAttemptsException: null,
    TooManyRequestsException: null,
    UnexpectedLambdaException: null,
    UserLambdaValidationException: null,
    UserNotFoundException: null,
  })
type ConfirmSignUpErrorNames = t.TypeOf<typeof ConfirmSignUpErrorNames>

const ForgotPasswordErrorNames = t.keyof(
  {
    CodeDeliveryFailureException: null,
    InternalErrorException: null,
    InvalidEmailRoleAccessPolicyException: null,
    InvalidLambdaResponseException: null,
    InvalidParameterException: null,
    InvalidSmsRoleAccessPolicyException: null,
    InvalidSmsRoleTrustRelationshipException: null,
    LimitExceededException: null,
    NotAuthorizedException: null,
    ResourceNotFoundException: null,
    TooManyRequestsException: null,
    UnexpectedLambdaException: null,
    UserLambdaValidationException: null,
    UserNotFoundException: null,
  })
type ForgotPasswordErrorNames = t.TypeOf<typeof ForgotPasswordErrorNames>


const ConfirmForgotPasswordErrorNames = t.keyof(
  {
    CodeMismatchException: null,
    ExpiredCodeException: null,
    InternalErrorException: null,
    InvalidLambdaResponseException: null,
    InvalidParameterException: null,
    InvalidPasswordException: null,
    LimitExceededException: null,
    NotAuthorizedException: null,
    ResourceNotFoundException: null,
    TooManyFailedAttemptsException: null,
    TooManyRequestsException: null,
    UnexpectedLambdaException: null,
    UserLambdaValidationException: null,
    UserNotConfirmedException: null,
    UserNotFoundException: null,
  })
type ConfirmForgotPasswordErrorNames = t.TypeOf<typeof ConfirmForgotPasswordErrorNames>

const ChangePasswordErrorNames = t.keyof(
  {
    InternalErrorException: null,
    InvalidParameterException: null,
    InvalidPasswordException: null,
    LimitExceededException: null,
    NotAuthorizedException: null,
    PasswordResetRequiredException: null,
    ResourceNotFoundException: null,
    TooManyRequestsException: null,
    UserNotConfirmedException: null,
    UserNotFoundException: null,
  })
type ChangePasswordErrorNames = t.TypeOf<typeof ChangePasswordErrorNames>


const UpdateUserAttributesErrorNames = t.keyof(
  {
    AliasExistsException: null,
    CodeDeliveryFailureException: null,
    CodeMismatchException: null,
    ExpiredCodeException: null,
    InternalErrorException: null,
    InvalidEmailRoleAccessPolicyException: null,
    InvalidLambdaResponseException: null,
    InvalidParameterException: null,
    InvalidSmsRoleAccessPolicyException: null,
    InvalidSmsRoleTrustRelationshipException: null,
    NotAuthorizedException: null,
    PasswordResetRequiredException: null,
    ResourceNotFoundException: null,
    TooManyRequestsException: null,
    UnexpectedLambdaException: null,
    UserLambdaValidationException: null,
    UserNotConfirmedException: null,
    UserNotFoundException: null,
  })
type UpdateUserAttributesErrorNames = t.TypeOf<typeof UpdateUserAttributesErrorNames>

const VerifyUserAttributeErrorNames = t.keyof(
  {
    CodeMismatchException: null,
    ExpiredCodeException: null,
    InternalErrorException: null,
    InvalidParameterException: null,
    LimitExceededException: null,
    NotAuthorizedException: null,
    PasswordResetRequiredException: null,
    ResourceNotFoundException: null,
    TooManyRequestsException: null,
    UserNotConfirmedException: null,
    UserNotFoundException: null,
  }
)
type VerifyUserAttributeErrorNames = t.TypeOf<typeof VerifyUserAttributeErrorNames>

export const AllCognitoErrorNames = t.union([
  CommonErrorNames,
  SignupErrorNames,
  InitiateAuthErrorNames,
  RespondToAuthChallengeErrorNames,
  ResendConfirmationCodeErrorNames,
  ConfirmSignUpErrorNames,
  ForgotPasswordErrorNames,
  ConfirmForgotPasswordErrorNames,
  ChangePasswordErrorNames,
  UpdateUserAttributesErrorNames,
  VerifyUserAttributeErrorNames,
])
export type AllCognitoErrorNames = t.TypeOf<typeof AllCognitoErrorNames>

export interface CognitoError {
  name: AllCognitoErrorNames
  message?: string
}

export interface SignUpError extends CognitoError {
  name: CommonErrorNames | SignupErrorNames
}

export interface InitiateAuthError extends CognitoError {
  name: CommonErrorNames | InitiateAuthErrorNames
}

export interface RespondToAuthChallengeError extends CognitoError {
  name: CommonErrorNames | RespondToAuthChallengeErrorNames
}

export interface ResendConfirmationCodeError extends CognitoError {
  name: CommonErrorNames | ResendConfirmationCodeErrorNames
}

export interface ConfirmSignUpError extends CognitoError {
  name: CommonErrorNames | ConfirmSignUpErrorNames
}

export interface ForgotPasswordError extends CognitoError {
  name: CommonErrorNames | ForgotPasswordErrorNames
}

export interface ConfirmForgotPasswordError extends CognitoError {
  name: CommonErrorNames | ConfirmForgotPasswordErrorNames
}

export interface ChangePasswordError extends CognitoError {
  name: CommonErrorNames | ChangePasswordErrorNames
}

export interface UpdateUserAttributesError extends CognitoError {
  name: CommonErrorNames | UpdateUserAttributesErrorNames
}

export interface VerifyUserAttributeError extends CognitoError {
  name: CommonErrorNames | VerifyUserAttributeErrorNames
}
