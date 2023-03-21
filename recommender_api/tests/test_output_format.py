import json
import os

from recommender_api import ptv

BASEDIR = os.path.dirname(os.path.realpath(__file__))
EXPECTED_SERVICE_CHANNEL = {
    'service_channel_id': '961f1a02-0eb7-4b5d-9721-6b9f2d14ec6f',
    'service_channel_name': 'Otavan Opisto / Otavia',
    'service_channel_type': 'ServiceLocation',
    'service_channel_description': "Otavan Opiston kampus sijaitsee 5-tien varressa 13 km Mikkelistä etelään. "
    "Kampuksen alueella on päärakennuksen lisäksi ruokala ja asuntola. "
    "Otavan Opisto on vuonna 1892 perustettu kansanopisto, joka järjestää vapaan sivistystyön koulutuksia, "
    "kuten lyhytkursseja ja pitkiä linjoja sekä valtionavun ulkopuolisia koulutuksia. "
    "Otavan Opistolla on myös internaattimuotoinen aikuislukio sekä oikeus järjestää vapaan "
    "sivistystyön koulutuksia etäopetuksena.\n\nOtavan Opisto on osa Mikkelin kaupungin liikelaitos Otaviaa. "
    "Otavian erityisosaamista ovat perusopetuksen ja lukiokoulutuksen etäopetus ja verkkopedagogiikka, "
    "monikulttuuristen ryhmien opetus sekä vapaan sivistystyön koulutukset. "
    "Otavia tarjoaa koulutusta ja koulutuksen kehittämiseen liittyviä palveluita "
    "alueellisesti, valtakunnallisesti ja globaalisti.",
    'service_channel_description_summary': 'Otavan Opiston kampus sijaitsee Otavassa, '
    'Mikkelissä.',
    'phone_numbers': ['Opintoasiainvastaava +358 447943552', '+358 447943565'],
    'web_pages': [
        'http://www.otavanopisto.fi/',
        'http://www.nettilukio.fi',
        'http://www.nettiperuskoulu.fi',
        'http://aineopiskelu.otavanopisto.fi/aineopiskelu_etusivu',
    ],
    'emails': [
        'info@otavia.fi',
        'nettilukio@otavia.fi',
        'nettiperuskoulu@otavia.fi',
        'aineopiskelu@otavia.fi',
        'kurssit@otavanopisto.fi',
        'maahanmuuttajakoulutukset@otavanopisto.fi',
        'aikuislukio@otavanopisto.fi',
    ],
    'address': 'Otavantie 2 B, 50670, Mikkeli',
    'location': {'latitude': '6834688', 'longitude': '503879'},
    'service_hours': [
        'Monday 08:00:00 - 16:00:00, Tuesday 08:00:00 - 16:00:00, '
        'Wednesday 08:00:00 - 16:00:00, Thursday 08:00:00 - 16:00:00, '
        'Friday 08:00:00 - 16:00:00'
    ],
}


EXPECTED_SERVICE = {
    'area_type': 'Nationwide',
    'areas': [],
    'charge_additional_info': '',
    'charge_type': 'FreeOfCharge',
    'responsible_organization': {
        'id': 'df0c2f24-d2bd-4ba7-bdcd-fcfc9f0d65a7',
        'name': 'Mikkelin kaupungin liikelaitos Otavia',
    },
    'requirements': [
        'Nettilukio on aikuislukio ja hakijan tulee olla vähintään 18-vuotias.'
    ],
    'service_channels': [EXPECTED_SERVICE_CHANNEL],
    'target_groups': ["KR1"],
    'service_collections': ["744c4b61-fde5-4d23-a844-cee5728b9119"],
    'service_class_uris': [
        'http://uri.suomi.fi/codelist/ptv/ptvserclass/code/P6.10',
        'http://uri.suomi.fi/codelist/ptv/ptvserclass/code/P6.8',
        'http://uri.suomi.fi/codelist/ptv/ptvserclass/code/P6.13',
        'http://uri.suomi.fi/codelist/ptv/ptvserclass/code/P6',
    ],
    "funding_type": "PubliclyFunded",
    'service_description_summary': 'Aikuislukio verkko-opintoina.',
    'user_instruction': "Hae Nettilukioon sähköisellä hakulomakkeella. "
    "Toimita lisäksi aikaisemmat koulutodistukset joko liittämällä "
    "todistustiedostot suoraan hakemukseen tai lähettämällä todistuskopiot postitse. "
    "Jos olet ollut aiemmin muissa lukioissa, tarvitsemme niistä erotodistukset. "
    "Mikäli sinulla on ammatillinen tutkinto, on hyvä lähettää myös tutkintotodistus. "
    "Muussa tapauksessa pyydämme lähettämään perusopetuksen päättötodistuksen. ",
    'service_description': "Nettilukiossa voit opiskella koko aikuislukion oppimäärän itsenäisenä "
    "verkko-opiskeluna omassa aikataulussasi. Opinnot voit aloittaa mihin "
    "aikaan vuodesta tahansa.\n\nNettilukiossa et ole sidoksissa lukukausiin "
    "tai lukion jaksoihin, vaan voit edetä oman aikataulusi ja suunnitelmasi "
    "mukaisesti. Jokaisella nettilukiolaisella on oma ohjaaja, joka auttaa "
    "opintojen suunnittelussa, tukee opintojen aikana ja jonka puoleen "
    "opiskelija voi kääntyä opintoihin liittyvissä kysymyksissä. Ohjaaja "
    "auttaa myös jatko-opiskelusuunnitelmissa ja uranvalinnan "
    "pohtimisessa.\n\nKaikki kurssit ovat verkossa saatavilla, joten voit "
    "opiskella mistä päin Suomea tai maailmaa tahansa. Nettilukiossa opiskelet "
    "Otavian kehittämässä Muikku-oppimisympäristössä, josta löytyvät myös "
    "sähköiset oppimateriaalit. Voit opiskella itsenäisesti suoritettavilla "
    "verkkokursseilla, ryhmäkursseilla tai tehdä ilmiöpohjaisia opintoja. "
    "Nettilukiossa osoitat osaamisesi tehtävillä ja oppimispäiväkirjalla, "
    "joten kokeita Nettilukiossa ei ole.",
    'service_id': '3668d250-cd80-45c4-abcc-9b2d3a2b3e42',
    'service_name': 'Nettilukio aikuisille',
}


def test_format_service_channel_output():
    with open(
        f'{BASEDIR}/test_data/otava_service_channel.json', 'r', encoding='utf-8'
    ) as f:
        otava_channel = json.load(f)

    formated_output = ptv._format_service_channel_output(otava_channel, 'fi')
    print(formated_output)
    assert formated_output == EXPECTED_SERVICE_CHANNEL


def test_format_service_output():
    with open(f'{BASEDIR}/test_data/etalukio_service.json', 'r', encoding='utf-8') as f:
        etalukio_service = json.load(f)

    with open(
        f'{BASEDIR}/test_data/otava_service_channel.json', 'r', encoding='utf-8'
    ) as f:
        otava_channel = json.load(f)

    formatted_output = ptv._format_service_outputs([etalukio_service], [otava_channel], 'fi')
    print(formatted_output)
    assert formatted_output == [EXPECTED_SERVICE]
