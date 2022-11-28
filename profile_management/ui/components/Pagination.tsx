import useTranslation from "next-translate/useTranslation"
import { useState } from "react"
import { Block, suomifiDesignTokens, Icon, Button } from "suomifi-ui-components"

const ContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}

const ButtonStyle = {
  color: suomifiDesignTokens.colors.highlightLight1,
  border: `1px solid ${suomifiDesignTokens.colors.depthLight1}`,
  padding: "0 0.85rem",
  borderRadius: 0,
}

const ChevronButtonStyle = {
  color: suomifiDesignTokens.colors.highlightLight1,
  border: `1px solid ${suomifiDesignTokens.colors.depthLight1}`,
  padding: "0.25rem 0.65rem",
  borderRadius: 0,
}

const IconStyle = {
  marginTop: "0.2rem",
}

export function Pagination({
  items,
  itemsPerPage = 5,
  onChange,
}: {
  items: unknown[]
  itemsPerPage: number
  onChange: (items: unknown[]) => void
}): JSX.Element | null {
  const [page, setPage] = useState<number>(0)
  const { t } = useTranslation("pagination")

  const handleChange = (newPage: number) => {
    setPage(newPage)
    const trimStart = newPage * itemsPerPage
    const trimEnd = trimStart + itemsPerPage
    onChange(items.slice(trimStart, trimEnd))
    window.scrollTo(0, 0)
  }

  const itemCount = items.length
  const pageCount = Math.ceil(itemCount / itemsPerPage)
  if (!items || items.length <= itemsPerPage) return null
  return (
    <Block style={ContainerStyle}>
      <Button
        id="pagination-previous-page"
        variant="secondary"
        onClick={() => handleChange(page - 1)}
        disabled={page === 0}
        style={{
          ...ChevronButtonStyle,
          ...(page === 0 && {
            color: suomifiDesignTokens.colors.depthBase,
          }),
        }}
        aria-label={t("previousPage")}
      >
        <Icon icon="chevronLeft" style={IconStyle}></Icon>
      </Button>
      {[...Array(pageCount)].map((_x, i) => (
        <Button
          id={`pagination-page-${i + 1}`}
          variant={page === i ? "default" : "secondary"}
          key={i}
          onClick={() => handleChange(i)}
          aria-label={`${t("page")} ${i + 1}`}
          style={{
            ...ButtonStyle,
            ...(page == i && {
              backgroundColor: suomifiDesignTokens.colors.highlightLight1,
              color: suomifiDesignTokens.colors.whiteBase,
            }),
          }}
        >
          {i + 1}
        </Button>
      ))}
      <Button
        id="pagination-next-page"
        variant="secondary"
        onClick={() => handleChange(page + 1)}
        disabled={page + 1 === pageCount}
        style={{
          ...ChevronButtonStyle,
          ...(page + 1 === pageCount && {
            color: suomifiDesignTokens.colors.depthBase,
          }),
        }}
        aria-label={t("nextPage")}
      >
        <Icon icon="chevronRight" style={IconStyle}></Icon>
      </Button>
    </Block>
  )
}
