export const decodeBasicAuthCredentials = (
  credentials: string
): [string, string] | undefined => {
  try {
    const [username, ...password] = Buffer.from(credentials, "base64")
      .toString()
      .split(":")

    return [username, password.join(":")]
  } catch (e) {
    return undefined
  }
}
