import crypto from "crypto"

export function generateToken(): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) =>
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        reject(err)
      } else {
        resolve(buffer)
      }
    })
  )
}

export function tokenForTransfer(token: Buffer): string {
  return token.toString("hex")
}

export function tokenFromTransfer(token: string): Buffer {
  return Buffer.from(token, "hex")
}
