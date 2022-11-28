export type QueryParams = Record<string, string | number | string[] | number[]>

export const encodeQueryParams = (params: QueryParams): string =>
  Object.entries(params)
    .map(([key, value]) =>
      Array.isArray(value)
        ? value.map(
            (item: number | string) => `${key}[]=${encodeURIComponent(item)}`
          )
        : `${key}=${encodeURIComponent(value)}`
    )
    .join("&")

export const stringPairQueryParams = (
  params: Record<string, string | string[] | undefined>
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, value?.toString() ?? ""])
  )
