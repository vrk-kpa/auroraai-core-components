import * as React from "react"
import { Block, Button } from "suomifi-ui-components"
import municipalities from "./municipalities.json"
import "./styles.css"

const getMunicipality = (code: string) =>
  municipalities.find(({ id }) => id === code)?.label?.fi ?? "Tuntematon kunta"

const LifeSituationValue = ({
  life_situation,
}: {
  life_situation: Record<string, number>
}) => {
  return (
    <table>
      <tbody>
        <tr>
          <td>Terveydentila</td>
          <td>{life_situation["health"]}</td>
        </tr>
        <tr>
          <td>Vaikeuksien voittaminen</td>
          <td>{life_situation["resilience"]}</td>
        </tr>
        <tr>
          <td>Asuminen</td>
          <td>{life_situation["housing"]}</td>
        </tr>
        <tr>
          <td>Työ</td>
          <td>{life_situation["working_studying"]}</td>
        </tr>
        <tr>
          <td>Perhe</td>
          <td>{life_situation["family"]}</td>
        </tr>
        <tr>
          <td>Ystävät</td>
          <td>{life_situation["friends"]}</td>
        </tr>
        <tr>
          <td>Talous</td>
          <td>{life_situation["finance"]}</td>
        </tr>
        <tr>
          <td>Vahvuuksien kehittäminen</td>
          <td>{life_situation["improvement_of_strengths"]}</td>
        </tr>
        <tr>
          <td>Itsetunto</td>
          <td>{life_situation["self_esteem"]}</td>
        </tr>
        <tr>
          <td>Elämä kokonaisuutena</td>
          <td>{life_situation["life_satisfaction"]}</td>
        </tr>
      </tbody>
    </table>
  )
}

const getFinnishAttributeName = (name: string) => {
  const translations: Record<string, string> = {
    age: "Ikä",
    municipality_code: "Kunta",
    life_situation_meters: "Elämäntilanne",
  }

  return translations[name] ?? name
}

const shareAttribute =
  (attribute: string, callback: (value: boolean) => any) => () => {
    fetch("api/auroraai-attributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([attribute]),
    }).then((r) => {
      callback(r.ok)
      return r.text()
    })
  }

const AttributeRow = ({
  entry,
  shareable,
}: {
  entry: Array<any>
  shareable: boolean
}) => {
  const [shared, setShared] = React.useState<boolean>(false)
  const [error, setError] = React.useState<boolean>(false)

  if (entry.length !== 2 || !entry[0]) return null

  const button = shareable ? (
    <Button
      id={`button_share_${entry[0]}`}
      onClick={shareAttribute(entry[0], (value) => {
        value ? setShared(value) : setError(true)
      })}
      disabled={shared}
    >
      Jaa AAI-verkkoon
    </Button>
  ) : null

  let attributeOutput: JSX.Element | string
  if (entry[1] === undefined || entry[1] === null)
    attributeOutput = "Ei saatavilla"
  else if (entry[0] === "municipality_code")
    attributeOutput = getMunicipality(entry[1])
  else if (entry[0] === "life_situation_meters")
    attributeOutput = <LifeSituationValue life_situation={entry[1]} />
  else attributeOutput = JSON.stringify(entry[1])

  return (
    <div id={`row_attribute_${entry[0]}`} className={"attributeRow"}>
      <div className={"attributeCell attributeName"}>
        {getFinnishAttributeName(entry[0])}
      </div>
      <div
        id={`cell_attribute_${entry[0]}`}
        className={"attributeCell attributeValue"}
      >
        {attributeOutput}
      </div>
      <div className={"attributeCell attributeControls"}>
        {button}
        {error && (
          <span
            className="errorMessage"
            style={{ marginLeft: "10px", color: "red" }}
          >
            Ei sallittu
          </span>
        )}
      </div>
    </div>
  )
}

const AttributeView = ({
  url,
  heading,
  shareable,
}: {
  url: string
  heading: string
  shareable: boolean
}) => {
  type AttributeValues = { age?: number; municipality_code?: string }
  const [attributes, setAttributes] = React.useState<AttributeValues>()
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    const fetchAttributes = async (url: string) => {
      const abortController = new AbortController()
      const signal = abortController.signal

      const response = await fetch(url, { signal })
      const result = await response.json()
      response.ok ? setAttributes(result) : setError(result.error)
      return () => abortController.abort()
    }

    ;(async () => fetchAttributes(url))()
  }, [])

  let content = <div>Ladataan...</div>

  if (error) {
    content = <div>Haku epäonnistui: {error}. Oletko kirjautunut sisään?</div>
  } else if (attributes) {
    const attributeRows = Object.entries(attributes ?? {}).map((it) => (
      <AttributeRow key={it[0]} entry={it} shareable={shareable} />
    ))
    content = <div className={"attributeTable"}>{attributeRows}</div>
  }

  return (
    <Block margin={"m"}>
      <h3>{heading}</h3>
      {content}
    </Block>
  )
}

export function OAuthHome(props: any) {
  return (
    <div>
      <AttributeView
        heading={"Käyttäjän syöttämät attribuutit"}
        url={"api/local-attributes"}
        shareable={true}
      />
      <AttributeView
        heading={"AuroraAI verkosta haetut attribuutit"}
        url={"api/auroraai-attributes"}
        shareable={false}
      />
      <Block margin={"m"} className={"mockBody"}>
        <h3>AuroraAI hallinta</h3>
        <div>Siirry AuroraAI-tilille:</div>
        <Button
          id={"button-auroraai-profile"}
          onClick={() =>
            (location.href = `auroraai/profile${
              props.match.params.locale
                ? `?locale=${props.match.params.locale}`
                : ""
            }`)
          }
        >
          Siirry AuroraAI-tilille
        </Button>
        <div>
          Voit lopettaa tietojen jakamisen muihin palveluihin poistamalla tämän
          palvelun AuroraAI verkostasi:
        </div>

        <Button
          id={"button-auroraai-revoke"}
          onClick={() => (location.href = "oauth/revoke/auroraai")}
        >
          Poista palvelu
        </Button>
        <div>Kirjaudu ulos AuroraAI tililtä:</div>
        <Button
          id={"button-auroraai-logout"}
          onClick={() =>
            (location.href = `auroraai/logout${
              props.match.params.locale
                ? `?locale=${props.match.params.locale}`
                : ""
            }`)
          }
        >
          Kirjaudu ulos
        </Button>
      </Block>
      <p id="page-locale" style={{ fontSize: "10pt" }}>
        locale: {props.match.params.locale ?? "fi"}
      </p>
    </div>
  )
}
