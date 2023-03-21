import React, { FC, useState } from 'react'
import { Block, Button, Modal, ModalContent, ModalFooter, ModalTitle } from 'suomifi-ui-components'
import MunicipalitiesFilter from './MunicipalitiesFilter'
import { FilterProps } from './FilterTypes'
import { NationalServiceFilter } from './NationalServiceFilter'

export const FilterModal: FC<FilterProps> = ({ filters, setFilters }) => {
  const [visible, setVisible] = useState<boolean>(false)

  const show = () => setVisible(true)
  const hide = () => setVisible(false)

  return (
    <Block mb='m'>
      <Button variant={'secondary'} onClick={show}>
        Tarkempi rajaus
      </Button>

      <Modal visible={visible} appElementId='root' onEscKeyDown={hide}>
        <ModalContent>
          <ModalTitle>Rajaa hakutuloksia</ModalTitle>
          <NationalServiceFilter filters={filters} setFilters={setFilters} name={'modalNationalFilter'} />
          <MunicipalitiesFilter filters={filters} setFilters={setFilters} />
        </ModalContent>
        <ModalFooter>
          <Button aria-label='Ok' onClick={hide}>
            OK
          </Button>
        </ModalFooter>
      </Modal>
    </Block>
  )
}
