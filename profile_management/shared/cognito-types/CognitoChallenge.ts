export enum ChallengeType {
  SMS_MFA = "SMS_MFA",
  SOFTWARE_TOKEN_MFA = "SOFTWARE_TOKEN_MFA",
  SELECT_MFA_TYPE = "SELECT_MFA_TYPE",
  MFA_SETUP = "MFA_SETUP",
  PASSWORD_VERIFIER = "PASSWORD_VERIFIER",
  CUSTOM_CHALLENGE = "CUSTOM_CHALLENGE",
  DEVICE_SRP_AUTH = "DEVICE_SRP_AUTH",
  DEVICE_PASSWORD_VERIFIER = "DEVICE_PASSWORD_VERIFIER",
  NEW_PASSWORD_REQUIRED = "NEW_PASSWORD_REQUIRED",
}

export type ChallengeResponse = {
  challengeName: ChallengeType.PASSWORD_VERIFIER;
  challengeParameters: {
    userId: string;
    salt: string;
    srpB: string;
    secretBlock: string;
  };
  session: string;
};
