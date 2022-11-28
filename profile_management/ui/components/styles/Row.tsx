import styled from "styled-components"

export const Row = styled.div<{ gap: string }>`
  display: flex;
  gap: ${({ gap }): string => gap};
  flex-wrap: wrap;
`
