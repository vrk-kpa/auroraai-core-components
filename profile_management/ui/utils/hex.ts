// https://github.com/aws-amplify/amplify-js/blob/eb3b707722084f07d025344bf6bbc34927b79bf5/packages/amazon-cognito-identity-js/src/AuthenticationHelper.js#L354
const HEX_MSB_REGEX = /^[89a-f]/i
export const padHex = (bigInt: bigint): string => {
  const isNegative = bigInt < 0

  let hexStr = (isNegative ? -bigInt : bigInt).toString(16)

  hexStr = hexStr.length % 2 !== 0 ? `0${hexStr}` : hexStr

  hexStr = HEX_MSB_REGEX.test(hexStr) ? `00${hexStr}` : hexStr

  if (isNegative) {
    const invertedNibbles = hexStr
      .split("")
      .map((x) => "0123456789ABCDEF".charAt(~parseInt(x, 16) & 0xf))
      .join("")

    const flippedBitsBI = BigInt("0x" + invertedNibbles) + BigInt(1)

    hexStr = flippedBitsBI.toString(16)

    if (hexStr.toUpperCase().startsWith("FF8")) {
      hexStr = hexStr.substring(2)
    }
  }

  return hexStr
}
