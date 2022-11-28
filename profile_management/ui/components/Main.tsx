import { DetailedHTMLProps, HTMLAttributes, PropsWithChildren } from "react"
import { BrowserCompat } from "./BrowserCompat"

export function Main({
  children,
  ...props
}: PropsWithChildren<
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
>): JSX.Element {
  return (
    <main tabIndex={-1} id="main" css={{ outline: "none" }} {...props}>
      <BrowserCompat />

      {children}
    </main>
  )
}
