insert into
    service_recommender.service(
        service_id,
        service_name,
        description_summary,
        municipality_codes,
        area_type,
        service_class_name,
        description,
        service_data
    )
values
    (
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        'Taideopetus kulttuurikeskuksissa',
        'kurssi taide harrastus',
        '091',
        'Municipality',
        'Nimi1',
        'Taideopetukseen liittyvä palvelu.',
        '{"id": "d64476db-f2df-4699-bb6a-1bfae007577a", "serviceNames": [{"language": "fi", "value": "Taideopetus kulttuurikeskuksissa", "type": "Name"}], "targetGroups": [{"code": "KR1"}], "serviceCollections": [{"id": "744c4b61-fde5-4d23-a844-cee5728b9119","name": [{"value": "Kaavoitus ja maankäyttö","language": "fi"}]}], "serviceChannels": [{"serviceChannel": {"id": "8e41462f-87e8-41d5-a14a-727b680f781c"}}, {"serviceChannel": {"id": "f283c2dc-8223-408a-8a73-1d62489e1f58"}}, {"serviceChannel": {"id": "fadd4cc4-4a00-4002-afb1-bbcfacdde5c1"}}, {"serviceChannel": {"id": "d589d34d-7dc1-4e25-af7b-dfd2ee9bf062"}}]}' :: jsonb
    ),
    (
        'e7df7411-64ef-48ef-ad5f-eebacde480e2',
        'Harrastustoiminta',
        'harrastusmahdollisuus',
        '091',
        'Municipality',
        'Nimi2',
        'Harrastukset on ihmiselle hyväksi.',
        '{"id": "e7df7411-64ef-48ef-ad5f-eebacde480e2", "serviceNames": [{"language": "fi", "value": "Harrastustoiminta", "type": "Name"}], "serviceChannels": []}' :: jsonb
    ),
    (
        '6c415cf0-827d-47d0-86e4-866100bc86a8',
        'Työnhakuvalmennus',
        'Työnhakutaitoja voi opiskella TE-toimistojen työnhakuvalmennuksissa tai valtakunnallisissa työnhaun verkkoryhmissä.',
        '',
        'Nationwide',
        'Nimi3',
        'Työnhakuun on hyvä valmentautua.',
        '{"id": "6c415cf0-827d-47d0-86e4-866100bc86a8", "serviceNames": [{"language": "fi", "value": "Työnhakuvalmennus", "type": "Name"}], "serviceChannels": []}' :: jsonb
    ),
    (
        '07058248-f002-4897-b1d5-7df9aa734c55',
        'Osallistu päätöksentekoon ja lainvalmisteluun',
        'Kansalainen voi vaikuttaa päätöksentekoon antamalla lausunnon valmistelussa olevaan asiaan tai osallistumalla kansalaiskeskusteluun.',
        '',
        'Nationwide',
        'Nimi4',
        'Vaikka et olisi kansanedustaja, voit osallistua päätöksentekoon ja vaikuttaa!',
        '{"id": "07058248-f002-4897-b1d5-7df9aa734c55", "serviceNames": [{"language": "fi", "value": "Osallistu päätöksentekoon ja lainvalmisteluun", "type": "Name"}], "serviceChannels": [{"serviceChannel": {"id": "8e41462f-87e8-41d5-a14a-727b680f781c"}}]}' :: jsonb
    ),
    (
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        'Palvelu luokassa 5.3',
        'testi',
        '091',
        'Municipality',
        'Nimi5',
        'Tämän palvelu kuvaus on lyhykäinen.',
        '{"id": "b9e2ff7d-3d18-476d-94e0-4a818f1136d6", "serviceNames": [{"language": "fi", "value": "Palvelu luokassa 5.3", "type": "Name"}], "serviceChannels": [], "fundingType": "MarketFunded", "serviceClasses": [{"newUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.3", "newParentUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5"}]}' :: jsonb
    ),
    (
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
        'Palvelu luokissa 5.1 ja 10.2',
        'testi',
        '638',
        'Municipality',
        'Nimi6',
        'Tämä palvelu kuuluu useampaan eri luokkaan.',
        '{"id": "909e5065-ad9d-40f5-a54d-58c88b2f6bfc", "serviceNames": [{"language": "fi", "value": "Palvelu luokissa 5.1 ja 10.2", "type": "Name"}], "organizations": [{"organization": {"id": "7d38c671-98cd-4feb-8248-cc6a09f9e01c", "name": "Test organization"}, "roleType": "Responsible"}], "serviceChannels": [], "serviceClasses": [{"newUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5.1", "newParentUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P5"}, {"newUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10.2", "newParentUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10"}]}' :: jsonb
    ),
    (
        '811c88b7-74db-414c-bbce-9735c9feb14a',
        'Kansallinen palvelu luokissa 4.1 ja 10.2',
        'testi',
        '',
        'Nationwide',
        'Nimi7',
        'Tämä on kansallinen palvelu, ja se luokitellaan kuuluvaksi useampaan ryhmään.',
        '{"id": "811c88b7-74db-414c-bbce-9735c9feb14a", "serviceNames": [{"language": "fi", "value": "Kansallinen palvelu luokissa 4.1 ja 10.2", "type": "Name"}], "fundingType": "PubliclyFunded", "serviceChannels": [], "serviceClasses": [{"newUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P4.1", "newParentUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P4"}, {"newUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10.2", "newParentUri": "http://uri.suomi.fi/codelist/ptv/ptvserclass2/code/P10"}]}' :: jsonb
    );

insert into
    service_recommender.service_channel(service_channel_id, service_channel_data)
values
    (
        '8e41462f-87e8-41d5-a14a-727b680f781c',
        '{"id": "8e41462f-87e8-41d5-a14a-727b680f781c", "serviceChannelNames": [{"language": "fi", "value": "channel_name1", "type": "Name"}], "serviceChannelDescriptions": [{"language": "fi", "value": "channel 1 description summary", "type": "Summary"}, {"language": "fi", "value": "channel 1 description", "type": "Description"}], "webPages": []}' :: jsonb
    ),
    (
        'f283c2dc-8223-408a-8a73-1d62489e1f58',
        '{"id": "f283c2dc-8223-408a-8a73-1d62489e1f58", "serviceChannelNames": [{"language": "fi", "value": "channel_name2", "type": "Name"}], "serviceChannelDescriptions": [{"language": "fi", "value": "channel 2 description summary", "type": "Summary"}, {"language": "fi", "value": "channel 2 description", "type": "Description"}], "webPages": [{"url": "url2", "value": null, "language": "fi"}], "serviceChannelType": "EChannel"}' :: jsonb
    ),
    (
        'fadd4cc4-4a00-4002-afb1-bbcfacdde5c1',
        '{"id": "fadd4cc4-4a00-4002-afb1-bbcfacdde5c1", "serviceChannelNames": [{"language": "fi", "value": "channel_name3", "type": "Name"}], "serviceChannelDescriptions": [{"language": "fi", "value": "channel 3 description summary", "type": "Summary"}, {"language": "fi", "value": "channel 3 description", "type": "Description"}], "webPages": [], "serviceChannelType": "Phone"}' :: jsonb
    ),
    (
        'd589d34d-7dc1-4e25-af7b-dfd2ee9bf062',
        '{"id": "d589d34d-7dc1-4e25-af7b-dfd2ee9bf062", "serviceChannelNames": [{"language": "fi", "value": "channel_name2", "type": "Name"}], "serviceChannelDescriptions": [{"language": "fi", "value": "channel 4 description summary", "type": "Summary"}, {"language": "fi", "value": "channel 4 description", "type": "Description"}], "webPages": [{"url": "url4", "value": null, "language": "fi"}], "serviceChannelType": "PrintableForm"}' :: jsonb
    );

insert into
    service_recommender.service_vectors(
        service_id,
        municipality_code,
        health,
        resilience,
        housing,
        working_studying,
        family,
        friends,
        finance,
        improvement_of_strengths,
        self_esteem,
        life_satisfaction
    )
values
    (
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        '091',
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        1,
        0
    ),
    (
        'e7df7411-64ef-48ef-ad5f-eebacde480e2',
        '091',
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        0
    ),
    (
        '6c415cf0-827d-47d0-86e4-866100bc86a8',
        'national',
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        0
    ),
    (
        '07058248-f002-4897-b1d5-7df9aa734c55',
        'national',
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        0
    ),
    (
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        '091',
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        0
    ),
    (
        '909e5065-ad9d-40f5-a54d-58c88b2f6bfc',
        '638',
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        0
    ),
    (
        '811c88b7-74db-414c-bbce-9735c9feb14a',
        'national',
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    );

insert into
    service_recommender.recommendation(
        recommendation_id,
        session_id,
        calling_service,
        calling_organisation,
        recommendation_time,
        request_path,
        request_attributes
    )
values
    (
        99900,
        'test_session_attributes',
        'test_service',
        'test_organisation',
        '2021-02-09' :: date,
        '/recommend_service',
        '{"foo":  1, "bar":  2}' :: jsonb
    ),
    (
        99800,
        'test_session_attributes',
        'test_service',
        'test_organisation',
        '2021-02-08' :: date,
        '/recommend_service',
        '{"foo":  3, "bar":  4}' :: jsonb
    ),
    (
        99700,
        'xyz',
        'test_service',
        'test_organisation',
        '2021-02-09' :: date,
        '/recommend_service',
        '{"foo":  5, "bar":  6}' :: jsonb
    ),
    (
        99990,
        'test_feedback',
        'test_service',
        'test_organisation',
        '2021-02-09' :: date,
        '/recommend_service',
        '{"foo":  1, "bar":  2}' :: jsonb
    ),
    (
        99991,
        'test_feedback2',
        'test_service',
        'test_organisation',
        '2021-03-09' :: date,
        '/recommend_service',
        '{"foo":  1, "bar":  2}' :: jsonb
    ),
    (
        99992,
        'test_feedback3',
        'test_service',
        'test_organisation',
        '2021-03-09' :: date,
        '/recommend_service',
        '{"foo":  1, "bar":  2}' :: jsonb
    ),
    (
        99993,
        'test_feedback4',
        'test_service',
        'test_organisation',
        '2021-03-09' :: date,
        '/recommend_service',
        '{"foo":  1, "bar":  2}' :: jsonb
    );

insert into service_recommender.recommendation_service(recommendation_id, service_id) values
  (99990, 'e7df7411-64ef-48ef-ad5f-eebacde480e2'),
  (99990, 'd64476db-f2df-4699-bb6a-1bfae007577a'),
  (99990, '07058248-f002-4897-b1d5-7df9aa734c55'),
  (99990, 'b9e2ff7d-3d18-476d-94e0-4a818f1136d6'),
  (99991, 'd64476db-f2df-4699-bb6a-1bfae007577a'),
  (99991, '07058248-f002-4897-b1d5-7df9aa734c55'),
  (99991, 'b9e2ff7d-3d18-476d-94e0-4a818f1136d6'),
  (99992, 'd64476db-f2df-4699-bb6a-1bfae007577a'),
  (99992, '07058248-f002-4897-b1d5-7df9aa734c55'),
  (99992, 'b9e2ff7d-3d18-476d-94e0-4a818f1136d6'),
  (99993, 'd64476db-f2df-4699-bb6a-1bfae007577a'),
  (99993, '07058248-f002-4897-b1d5-7df9aa734c55'),
  (99993, 'b9e2ff7d-3d18-476d-94e0-4a818f1136d6');

insert into
    service_recommender.recommendation_redirect(
        id,
        recommendation_id,
        service_id,
        service_channel_id,
        redirect_time
    )
values
    (
        default,
        99990,
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        '8e41462f-87e8-41d5-a14a-727b680f781c',
        CURRENT_TIMESTAMP
    ),
    (
        default,
        99990,
        '07058248-f002-4897-b1d5-7df9aa734c55',
        '8e41462f-87e8-41d5-a14a-727b680f781c',
        CURRENT_TIMESTAMP
    ),
    (
        default,
        99991,
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        '8e41462f-87e8-41d5-a14a-727b680f781c',
        CURRENT_TIMESTAMP
    ),
    (
        default,
        99991,
        '07058248-f002-4897-b1d5-7df9aa734c55',
        '8e41462f-87e8-41d5-a14a-727b680f781c',
        CURRENT_TIMESTAMP
    ),
    (
        default,
        99992,
        '07058248-f002-4897-b1d5-7df9aa734c55',
        '8e41462f-87e8-41d5-a14a-727b680f781c',
        CURRENT_TIMESTAMP
    ),
    (
        default,
        99993,
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        '8e41462f-87e8-41d5-a14a-727b680f781c',
        CURRENT_TIMESTAMP
    ),
    (
        default,
        99993,
        '07058248-f002-4897-b1d5-7df9aa734c55',
        '8e41462f-87e8-41d5-a14a-727b680f781c',
        CURRENT_TIMESTAMP
    );

insert into
    service_recommender.recommendation_service_feedback(
        recommendation_id,
        service_id,
        feedback_score
    )
values
    (
        99990,
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        1
    ),
    (
        99991,
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        1
    ),
    (
        99992,
        'd64476db-f2df-4699-bb6a-1bfae007577a',
        -1
    ),
    (
        99992,
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        1
    ),
    (
        99993,
        'b9e2ff7d-3d18-476d-94e0-4a818f1136d6',
        -1
    );