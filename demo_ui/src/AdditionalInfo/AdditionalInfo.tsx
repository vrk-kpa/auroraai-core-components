import React, { FC } from 'react'
import { Heading } from 'suomifi-ui-components'
import { Section } from '../Section/Section'

export const AdditionalInfo: FC = () => {
  return (
    <>
      <Section>
        <Heading variant='h2'>Miten palvelu toimii?</Heading>
        <p>
          Täyttämäsi kyselyn vastaukset lähetetään Aurora AI suosittelukomponentille, joka analysoi tiedon tekoälyn
          avulla. Analysoinnin perusteella suosittelukomponentti hakee Palvelutietovarannosta sopivia palveluita ja
          palveluihin liittyviä tietoja, jotka näytetään sinulle.
        </p>
      </Section>
      <Section>
        <Heading variant='h2'>Miten huolehdimme tietosuojastasi palvelussa?</Heading>
        <p>
          Palvelussa ei käsitellä henkilötietoja. Tallennamme antamasi vastaukset kolmeksi kuukaudeksi, ja niitä voi
          nähdä Digi- ja väestötietoviraston palvelusta vastuulliset henkilöt sekä palvelun kehittäjät.
        </p>
      </Section>
      <Section>
        <Heading variant='h2'>Evästeet</Heading>
        <p>
          Palvelujen käyttäminen edellyttää evästeiden sallimista, keräämme evästeiden avulla tietoa palvelun
          kehittämistä ja vikatilanteiden ratkaisua varten. Evästeet ovat pieniä tekstitiedostoja, jotka tallentuvat
          koneellesi vierailemiltasi internetsivuilta. Jatkamalla sivuston käyttöä hyväksyt evästeiden käytön.
        </p>
      </Section>
      <Section>
        <Heading variant='h2'>Tietojen säilyminen palvelussa ja lokikirjaukset</Heading>
        <p>
          Täyttämäsi kysely tallennetaan arkistoon kolmeksi kuukaudeksi Mahdollisten vikatilanteiden selvittämistä
          varten kirjoitamme myös järjestelmän toiminnasta lokia, josta selviää, mitä käyttäjät ovat tehneet palvelussa.
          Lokitiedot poistuvat automaattisesti 1v3kk kuluttua.
        </p>
      </Section>
    </>
  )
}
