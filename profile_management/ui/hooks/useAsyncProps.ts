import { useEffect, useState } from "react"

/**
 * Helper hook for getting props client-side if
 * the `_needsFetch` flag is present (from `withToken`).
 */
export function useAsyncProps<
  T extends Record<string, unknown>,
  U extends unknown = undefined,
  G = T | (Partial<T> & { _needsFetch: true })
>(
  initialProps: G,
  getProps: U extends undefined
    ? () => Promise<T>
    : (baseProps: U) => Promise<T>,
  baseProps?: U
): { props: T | undefined; refresh: () => Promise<void> } {
  const [props, setProps] = useState<T>()

  useEffect(() => {
    let cancelled = false

    if ("_needsFetch" in initialProps) {
      getProps(baseProps).then((p) => {
        if (!cancelled) setProps(p)
      })
    } else {
      setProps(initialProps as T)
    }

    return () => {
      cancelled = true
    }
  }, [initialProps, getProps, baseProps])

  return {
    props,
    refresh: async () => {
      setProps(undefined)
      await getProps(baseProps).then(setProps)
    },
  }
}
