import { Paragraph, Text } from "suomifi-ui-components"

export function MultilineParagraph({
  text,
  ...rest
}: { text: string } & Paragraph["props"]): JSX.Element {
  return (
    <>
      {text.split("\n").map((paragraph, index) => (
        <Paragraph key={JSON.stringify([index, paragraph])} {...rest}>
          <Text>{paragraph}</Text>
        </Paragraph>
      ))}
    </>
  )
}
