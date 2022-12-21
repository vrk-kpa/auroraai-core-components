from recommender_api.wellbeing_service_county_codes import wellbeing_service_county_codes as wsc

TOTAL_COUNTIES= 23

def test_wellbeing_service_county_codes():
    assert len(wsc.valid_county_codes) == TOTAL_COUNTIES
    assert '08' in wsc.valid_county_codes
    assert '05' in wsc.valid_county_codes
    assert '21' in wsc.valid_county_codes
    assert '20' in wsc.valid_county_codes

def test_wellbeing_service_county_code_conversion():
    assert '529' in wsc.counties_to_municipalities(['05'])  # Naantali is in Varsinais-Suomen hyvinvointialue
    assert '049' in wsc.counties_to_municipalities(['03'])  # Espoo is in Länsi-Uudenmaan hyvinvointialue
    assert '905' in wsc.counties_to_municipalities(['17'])  # Vaasa is in Pohjanmaan hyvinvointialue
    assert '016' in wsc.counties_to_municipalities(['09'])  # Espoo is in Päijät-Hämeen hyvinvointialue
    assert '405' in wsc.counties_to_municipalities(['11'])  # Lappeenranta is in Etelä-Karjalan hyvinvointialue"
