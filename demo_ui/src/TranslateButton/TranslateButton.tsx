import {Dispatch, FC, SetStateAction, useState} from "react"
import {RecommendedService} from "../dto/RecommendServiceResponseDto"
import {useRecoilState} from "recoil"
import {translationLanguageState} from "../state/global"
import {Button} from "suomifi-ui-components"
import {fetchServiceTranslation} from "../http/api"

type TranslateButtonProps = {
  serviceId: string,
  setService: Dispatch<SetStateAction<RecommendedService>>
}

export const TranslateButton: FC<TranslateButtonProps> = ({serviceId, setService}) => {
  const [translationLanguage] = useRecoilState(translationLanguageState)

  const initialVisibility: "hidden" | "visible" = translationLanguage === "fi" ? "hidden" : "visible"
  const [visibility, setVisibility] = useState(initialVisibility)

  return (
    <Button
      variant='secondary'
      style={{visibility: visibility}}
      onClick={
        async () => {
          const translatedService = await handleServiceTranslation(serviceId, translationLanguage)
          if (typeof translatedService !== 'undefined') {
            setService(translatedService)
            setVisibility("hidden")
          }
        }
      }
    >
      Käännä palvelu ({translationLanguage})
    </Button>
  )
}

const handleServiceTranslation = async (serviceId: string, language: string): Promise<RecommendedService | undefined> => {
  const response = await fetchServiceTranslation(serviceId, language)
  if (response.ok) {
    const body = await response.json()
    return body.service as RecommendedService
  } else {
    return undefined
  }
}
