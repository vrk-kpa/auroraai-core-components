import { defaultProvider } from "@aws-sdk/credential-provider-node"
import { HttpRequest } from "@aws-sdk/protocol-http"
import { SignatureV4 } from "@aws-sdk/signature-v4"
import { Hash } from "@aws-sdk/hash-node"
import { formatUrl } from "@aws-sdk/util-format-url"
import { CredentialProvider, Credentials } from "@aws-sdk/types"
import { STS } from "@aws-sdk/client-sts"
import { AssumeRoleWithWebIdentityParams } from "@aws-sdk/credential-provider-web-identity/dist/types/fromWebToken"
import { config } from "./config"

export type Options = {
  credentials?: Credentials | CredentialProvider
  hostname: string
  port: number
  region: string
  username: string
}

const signing = {
  service: "rds-db",
  protocol: "https",
}

// adapted from: https://advancedweb.hu/how-to-fix-the-profile-support-in-the-aws-js-sdk-v3/
async function assume(
  params: AssumeRoleWithWebIdentityParams
): Promise<Credentials> {
  const sts = new STS({ region: config.region })
  const result = await sts.assumeRoleWithWebIdentity(params)
  if (!result.Credentials) {
    throw new Error("unable to assume credentials - empty credential object")
  }
  return {
    accessKeyId: String(result.Credentials.AccessKeyId),
    secretAccessKey: String(result.Credentials.SecretAccessKey),
    sessionToken: result.Credentials.SessionToken,
  }
}

// source: https://github.com/bendrucker/aws-sdk-js-v3-rds-signer
export async function getSignerAuthToken({
  hostname,
  port,
  username,
  region,
  credentials = defaultProvider({ roleAssumerWithWebIdentity: assume }),
}: Options): Promise<string> {
  const signer = new SignatureV4({
    service: "rds-db",
    region,
    credentials,
    sha256: Hash.bind(null, "sha256"),
  })

  const request = new HttpRequest({
    method: "GET",
    protocol: signing.protocol,
    hostname,
    port,
    query: {
      Action: "connect",
      DBUser: username,
    },
    headers: {
      host: `${hostname}:${port}`,
    },
  })

  const presigned = await signer.presign(request, {
    expiresIn: 900,
  })

  return formatUrl(presigned).replace(`${presigned.protocol}//`, "")
}
