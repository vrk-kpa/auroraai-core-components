import { suomifiDesignTokens } from 'suomifi-ui-components'
import styled from 'styled-components'
import { RecommendationFilter } from '../types'

const Container = styled.div`
  margin-top: ${suomifiDesignTokens.spacing.m};
  margin-bottom: ${suomifiDesignTokens.spacing.m};
`

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border-bottom: solid 1px ${suomifiDesignTokens.colors.depthLight1};
`

const ListItem = styled.li`
  box-sizing: border-box;
  display: inline-block;
  padding: ${suomifiDesignTokens.spacing.s} ${suomifiDesignTokens.spacing.xl} ${suomifiDesignTokens.spacing.s} 0;
  cursor: pointer;

  span {
    padding: ${suomifiDesignTokens.spacing.s};
  }

  &.active span {
    border-bottom: solid 4px ${suomifiDesignTokens.colors.highlightBase};
  }
`
type Filter = {
  type: RecommendationFilter
  name: string
}
const filters: Filter[] = [
  { type: 'location', name: 'Alue' },
  { type: 'service_class', name: 'Palveluluokka' },
  { type: 'target_group', name: 'Kohderyhmä' },
  { type: 'other', name: 'Muu' },
]

type Props = {
  children?: React.ReactNode
  active: RecommendationFilter
  setActive: (value: RecommendationFilter) => void
}

export const FiltersSelectionContainer: React.FC<Props> = ({ children, active, setActive }: Props) => {
  return (
    <Container>
      <List>
        {filters.map((item) => (
          <ListItem
            key={item.type}
            className={item.type === active ? 'active' : undefined}
            onClick={() => setActive(item.type)}
          >
            <span>{item.name}</span>
          </ListItem>
        ))}
      </List>
      <div>{children}</div>
    </Container>
  )
}
