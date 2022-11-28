import { FC } from 'react'
import { Button, Heading, suomifiDesignTokens } from 'suomifi-ui-components'
import { Section } from '../Section/Section'
import { useHistory } from 'react-router-dom'

export const DemoUIHome: FC = () => {
  const history = useHistory()

  return (
    <>
      <Section>
        <Heading variant='h2' style={{ color: `${suomifiDesignTokens.colors.highlightBase}` }}>
          Palvelusuositukset elämäntilanteesi perusteella
        </Heading>
        <p>
          3x10D on DIAKin tutkijoiden kehittämä elämäntilannemittari, jonka avulla on mahdollista kartoittaa käyttäjän
          elämäntilannetta. Kun käyttäjä on vastannut kyselyyn, suosittelija hakee hakee käyttäjän
          3x10D-elämäntilanteisiin sopivia palveluja. 3x10D-elämänalueiden lisäksi rajapintaan voi antaa tiedon
          vastaajan kotikunnasta. Lisäksi rajapinnassa voidaan määritellä mistä palveluluokista suosituksia palautetaan.
          Suositteluja on mahdollista hakea myös vaikka vain yhden elämänalueen osalta. Rajapinta palauttaa
          vastauksessaan palvelut, jotka parhaiten sopivat eri elämänalueista saatuihin tietoihin ja ovat yhdistelmä
          kaikista annetuista tiedoista.
        </p>

        <Button variant='link' onClick={() => history.push('/recommender')}>
          Palvelusuositteluun
        </Button>
      </Section>

      <Section>
        <Heading variant='h2' style={{ color: `${suomifiDesignTokens.colors.highlightBase}` }}>
          Vapaatekstisuosittelija
        </Heading>
        <p>
          Vapaatekstisuosittelija suosittelee palveluita PTV:n palvelukuvausten ja käyttäjän syöttämän hakulauseen
          vastaavuuteen perustuen. Lisäksi suosittelun tuloksia voidaan rajata alueiden, palveluluokkien ja kohderyhmien
          perusteella.
        </p>

        <Button variant='link' onClick={() => history.push('/search')}>
          Kokeile tekstisuosittelua
        </Button>
      </Section>
    </>
  )
}
