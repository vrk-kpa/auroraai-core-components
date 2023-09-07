import { FC } from 'react'
import { Block, Dropdown, DropdownItem } from 'suomifi-ui-components'
import { FilterProps } from './FilterTypes'
import { useTranslation } from 'react-i18next'

export const MaxResultsFilter: FC<FilterProps> = ({ filters, setFilters }) => {
  const { t } = useTranslation()

  const setMaxResultsFilter = (newValue: string) => {
    setFilters({
      ...filters,
      maxResults: parseInt(newValue, 10),
    })
  }

  return (
    <Block variant={'section'} mb='m' pb='m' style={{ borderBottom: 'solid lightgray' }}>
      <Dropdown
        alwaysShowVisualPlaceholder
        labelText={t('labelMaxResultsFilter')}
        onChange={setMaxResultsFilter}
        defaultValue='5'
      >
        <DropdownItem value='5'>5 {t('abbreviationPieces')}</DropdownItem>
        <DropdownItem value='10'>10 {t('abbreviationPieces')}</DropdownItem>
        <DropdownItem value='20'>20 {t('abbreviationPieces')}</DropdownItem>
        <DropdownItem value='50'>50 {t('abbreviationPieces')}</DropdownItem>
      </Dropdown>
    </Block>
  )
}
