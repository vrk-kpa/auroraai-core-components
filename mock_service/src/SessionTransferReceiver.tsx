import * as React from "react"
import municipalities from "./municipalities.json"

const session = new URLSearchParams(window.location.search).get(
  "auroraai_access_token"
)

const get3X10DColor = (value: number) => {
  if (value <= 6) {
    return "#DC2626"
  } else if (value <= 8) {
    return "#FBBF24"
  } else if (value <= 10) {
    return "#10B981"
  }

  return "#000000"
}

const lifeSituations = {
  family: "Perhe",
  finance: "Raha-asiat",
  friends: "Ystävät",
  health: "Terveys",
  housing: "Asuminen",
  improvement_of_strengths: "Itsensä kehittäminen",
  life_satisfaction: "Tyytyväisyys elämään",
  resilience: "Vaikeuksien voittaminen",
  self_esteem: "Itsetunto",
  working_studying: "Opiskelu tai työ",
} as { [key: string]: string }

export function SessionTransferReceiver() {
  const [attributes, setAttributes] = React.useState<{
    age?: number
    life_situation_meters?: { [key: string]: number[] }
    municipality_code?: string
  }>()
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    if (!session) return

    const abortController = new AbortController()

    fetch(
      `${
        (window as { serviceHost?: string }).serviceHost ??
        "http://localhost:7000"
      }/service-recommender/v1/session_attributes?access_token=${session}`,
      {
        signal: abortController.signal,
      }
    )
      .then((r) => r.json())
      .then((data) => {
        setAttributes(data)
      })
      .catch((error) => {
        setError(error.message)
      })

    return () => {
      abortController.abort()
    }
  }, [])

  if (!session) {
    return (
      <div>
        Luvitusavainta ei ole annettu. Tarkista, että linkki sisältää
        auroraai_access_token-parametrin.
      </div>
    )
  }

  if (error) {
    return <div>Attribuuttien haku epäonnistui: {error}</div>
  }

  if (!attributes) {
    return <div>Ladataan...</div>
  }

  if (typeof attributes !== "object" || attributes === null) {
    return (
      <div>
        Tallennetut attribuutit eivät ole tuetussa muodossa:{" "}
        {JSON.stringify(attributes, null, 4)}
      </div>
    )
  }

  return (
    <div>
      <p>
        Jos sivunlatauksen yhteydessä on välitetty luvitusavain, ja se on
        edelleen voimassa, näet alla siihen yhdistetyt attribuutit.
      </p>

      {attributes.age && (
        <div>
          <strong>Ikä</strong>: {attributes.age}
        </div>
      )}
      {attributes.municipality_code && (
        <div>
          <strong>Kunta</strong>:{" "}
          {municipalities.find(({ id }) => id === attributes.municipality_code)
            ?.label?.fi ?? "Tuntematon kunta"}
        </div>
      )}
      {attributes.life_situation_meters && (
        <div
          className="ttm-3x10d-grid"
          style={{
            display: "grid",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {Object.entries(attributes.life_situation_meters).map(
            ([key, meters]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    display: "flex",
                    color: "#fff",
                    fontWeight: "bold",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "9999px",
                    backgroundColor: get3X10DColor(meters[0]),
                    flexShrink: 0,
                  }}
                >
                  {meters[0]}
                </div>
                <div
                  style={{
                    flexGrow: 0,
                    minWidth: "0",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {lifeSituations[key] || key}
                </div>
              </div>
            )
          )}
        </div>
      )}
      {Object.entries(attributes)
        .filter(
          ([key]) =>
            !["municipality_code", "life_situation_meters", "age"].includes(key)
        )
        .map(([key, value]) => (
          <div key={key}>
            <strong>{key}</strong> <i>(tuntematon attribuutti)</i>:{" "}
            {JSON.stringify(value, null, 4)}
          </div>
        ))}
    </div>
  )
}
