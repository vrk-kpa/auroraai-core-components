export const concatOrCreateArray = <T>(
  array: T[] | undefined | null,
  item: T | T[]
): T[] => {
  if (Array.isArray(array)) {
    return Array.isArray(item) ? [...array, ...item] : [item]
  }

  return Array.isArray(item) ? item : [item]
}

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
