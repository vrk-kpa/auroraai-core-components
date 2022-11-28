import { useState } from 'react'
import { Button, Text } from 'suomifi-ui-components'
import { RecommendedService } from '../dto/RecommendServiceResponseDto'

export const ServiceDescription = ({ service }: { service: RecommendedService }) => {
  const [showDescription, setShowDescription] = useState<boolean>(false)
  return (
    <>
      {showDescription ? (
        <p>{service.service_description}</p>
      ) : (
        <>
          <p>
            <Text>{service.service_description_summary}</Text>
          </p>

          <Button variant='link' onClick={() => setShowDescription(true)}>
            Lue lisää
          </Button>
        </>
      )}
    </>
  )
}
