import React from "react"
import NextHead from "next/head"

interface HeadProps {
  pageName: string
}
export const Head: React.FunctionComponent<HeadProps> = ({ pageName }) => (
  <NextHead key={pageName}>
    <title>{pageName} - AuroraAI</title>
  </NextHead>
)
