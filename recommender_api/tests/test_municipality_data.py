from recommender_api.municipality_data import municipality_data as md, MOCK_SERVICE_MUNICIPALITY

TOTAL_MUNICIPALITIES = 310


def test_municipality_codes():
    assert len(md.valid_municipality_codes) == TOTAL_MUNICIPALITIES
    assert '091' in md.valid_municipality_codes
    assert '478' in md.valid_municipality_codes
    assert '020' in md.valid_municipality_codes
    assert '992' in md.valid_municipality_codes
    assert '000' in md.valid_municipality_codes  # Mock service code


def test_region_to_municipalities():
    assert md.valid_region_codes == {'01', '02', '04', '05', '06', '07', '08', '09', '10',
                                     '11', '12', '13', '14', '15', '16', '17', '18', '19', '21'}

    municipalities = [city for cities in md._region_mappings.values() for city in cities]
    assert set(municipalities).union({MOCK_SERVICE_MUNICIPALITY}) == md.valid_municipality_codes

    assert '091' in md.regions_to_municipalities(['01'])  # Helsinki is in Uusimaa
    assert '478' in md.regions_to_municipalities(['21'])  # Maarianhamina is in Ahvenanmaa
    assert '020' in md.regions_to_municipalities(['06'])  # Akaa is in Pirkanmaa
    assert '992' in md.regions_to_municipalities(['13'])  # Äänekoski is in Keski-Suomi

    assert {'091', '992'}.issubset(md.regions_to_municipalities(['01', '13']))


def test_hospital_district_to_municipalities():
    assert md.valid_hospital_district_codes == {'00', '03', '04', '05', '06', '07', '08', '09', '10',
                                                '11', '12', '13', '14', '15', '16', '17', '18', '19',
                                                '20', '21', '25'}

    municipalities = [city for cities in md._hospital_district_mappings.values() for city in cities]
    assert set(municipalities).union({MOCK_SERVICE_MUNICIPALITY}) == md.valid_municipality_codes

    assert '091' in md.hospital_districts_to_municipalities(['25'])  # Helsinki is in Helsingin ja Uudenmaan SHP
    assert '478' in md.hospital_districts_to_municipalities(['00'])  # Maarianhamina is in Ahvenanmaan
    assert '020' in md.hospital_districts_to_municipalities(['06'])  # Akaa is in Pirkanmaan SHP
    assert '992' in md.hospital_districts_to_municipalities(['14'])  # Äänekoski is in Keski-Suomen SHP

    assert {'091', '992'}.issubset(md.hospital_districts_to_municipalities(['25', '14']))
