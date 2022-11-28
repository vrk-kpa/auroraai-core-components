import * as schemas from "shared/schemas"

export const concatOrCreateArray = <T>(
  array: T[] | undefined | null,
  item: T | T[]
): T[] => {
  if (Array.isArray(array)) {
    return Array.isArray(item) ? [...array, ...item] : [item]
  }

  return Array.isArray(item) ? item : [item]
}

export const composeTranslatableSelect = (
  columnName: string,
  outputName?: string
): string =>
  schemas.LANGUAGES.map(
    (language) =>
      `(${columnName}).${language} as "${
        outputName ?? columnName.split(".").pop()
      }.${language}"`
  ).join(", ")

export type RawTranslatableObject<T extends string[]> = Record<
  `${T[number]}.${schemas.Language}`,
  string
>

export const transformRawTranslatableToObject = <T extends string>(
  key: T,
  object: RawTranslatableObject<[T]>
): schemas.TranslatableString =>
  Object.fromEntries(
    schemas.LANGUAGES.map((language) => [
      language,
      object[`${key}.${language}` as `${T}.${schemas.Language}`],
    ])
  ) as schemas.TranslatableString

export const removeDuplicates = <T, K extends keyof T>(
  arr: T[],
  specifier?: K
): T[] =>
  arr.filter(
    (value, index, array) =>
      (specifier
        ? array.findIndex(
            (otherValue) => otherValue[specifier] === value[specifier]
          )
        : array.indexOf(value)) === index
  ) as T[]

export const isObject = (obj: unknown): obj is Record<string, unknown> =>
  typeof obj === "object" && obj !== null

export const isEmptyObject = (obj: unknown): boolean =>
  isObject(obj) && Object.keys(obj).length === 0
