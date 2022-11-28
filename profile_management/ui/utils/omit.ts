export const omit = <T extends Record<string, unknown>, K extends (keyof T)[]>(
  obj: T,
  ...keys: K
): Omit<T, K[number]> =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as keyof T))
  ) as Omit<T, K[number]>
