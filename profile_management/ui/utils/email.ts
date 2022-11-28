export const censorEmail = (email: string): string => {
  const pieces = email.split("@")

  const hostPieces = pieces.pop()?.split(".") ?? []
  const tld = hostPieces.pop()
  const host = hostPieces.join(".")
  const prefix = pieces.join("@")

  return `${prefix[0] ?? "******"}${"*".repeat(
    Math.max(0, prefix.length - 1)
  )}@${host[0] ?? "******"}${"*".repeat(Math.max(0, host.length - 1))}.${tld}`
}
