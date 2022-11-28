import * as bigintModArith from "bigint-mod-arith"
import * as bigintConversion from "bigint-conversion"
import { padHex } from "./hex"

/**
 * This stub will likely throw an error when actually used,
 * but not when constructing the BigInt itself.
 */
const bigIntStub = () => 0 as unknown as bigint

const BigInt =
  typeof window !== "undefined" ? window.BigInt ?? bigIntStub : bigIntStub

const N = BigInt(
  "0x" +
    "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1" +
    "29024E088A67CC74020BBEA63B139B22514A08798E3404DD" +
    "EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245" +
    "E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED" +
    "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D" +
    "C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F" +
    "83655D23DCA3AD961C62F356208552BB9ED529077096966D" +
    "670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B" +
    "E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9" +
    "DE2BCBF6955817183995497CEA956AE515D2261898FA0510" +
    "15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64" +
    "ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7" +
    "ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B" +
    "F12FFA06D98A0864D87602733EC86A64521F2B18177B200C" +
    "BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31" +
    "43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF"
)

const g = BigInt(2)

const uint8ToHex = (array: Uint8Array) =>
  Array.from(array)
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")

const uint8ToBigInt = (array: Uint8Array) => bigintConversion.bufToBigint(array)

const hexToUint8Array = (hex: string) =>
  new Uint8Array((hex.match(/.{2}/g) || []).map((a) => parseInt(a, 16)))

export const generateSmallA = (): bigint =>
  uint8ToBigInt(crypto.getRandomValues(new Uint8Array(16)))

export const calculateA = (a: bigint): bigint => bigintModArith.modPow(g, a, N)

/**
 * This parameter is based on `N` and `g`, so it's
 * constant. If you want to regenerate it or generate
 * it dynamically on the client's side, you can use
 * this function:
 *
 * ```
 * (async () => {
 *   if (typeof window === "undefined") return BigInt(0)
 *
 *   const digest = await crypto.subtle.digest(
 *     "SHA-256",
 *     new Uint8Array(
 *       ((padHex(N) + padHex(g)).match(/.{2}/g) || []).map((a) => parseInt(a, 16))
 *     )
 *   )
 *
 *   return BigInt("0x" + uint8ToHex(new Uint8Array(digest)))
 * })()
 * ```
 */
const k = BigInt(
  "0x538282c4354742d7cbbde2359fcf67f9f5b3a6b08791e5011b43b8a5b66d9ee6"
)

const hexHash = async (hex: string) =>
  new Uint8Array(await crypto.subtle.digest("SHA-256", hexToUint8Array(hex)))

const calculateU = async (A: bigint, B: bigint) =>
  uint8ToBigInt(await hexHash(padHex(A) + padHex(B)))

const calculateX = async (salt: bigint, hash: string) =>
  uint8ToBigInt(await hexHash(padHex(salt) + hash))

const calculateS = async (x: bigint, B: bigint, a: bigint, U: bigint) => {
  const gModPowXN = bigintModArith.modPow(g, x, N)

  return bigintModArith.modPow(B - (await k) * gModPowXN, a + U * x, N)
}

const HmacSHA256 = async (data: ArrayBuffer, key: ArrayBuffer) =>
  crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    data
  )

export const getSRPPasswordKey = async (
  username: string,
  password: string,
  challengeParameters: { srpB: string; salt: string },
  a: bigint,
  poolName: string
): Promise<CryptoKey> => {
  const B = BigInt("0x" + challengeParameters.srpB)

  if (B % N === BigInt(0)) {
    throw Error("Invalid B")
  }

  const U = await calculateU(calculateA(a), B)

  if (U === BigInt(0)) {
    throw Error("Invalid state")
  }

  const salt = BigInt("0x" + challengeParameters.salt)

  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${poolName}${username}:${password}`)
  )

  const x = await calculateX(salt, uint8ToHex(new Uint8Array(hash)))

  const s = await calculateS(x, B, a, U)

  return crypto.subtle.importKey(
    "raw",
    (
      await HmacSHA256(
        new TextEncoder().encode("Caldera Derived Key\u0001"),
        await HmacSHA256(hexToUint8Array(padHex(s)), hexToUint8Array(padHex(U)))
      )
    ).slice(0, 16),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
}
