insert into aurora_ai_service (ptv_service_channel_id, supported_attributes)
values
    -- Lausuntopalvelut, used in examples
    ('5894b8d5-a7be-47f2-8474-8f476a933e94', '{age, life_situation_meters, municipality_code}'),
    -- Poikien puhelin
    ('743c59c6-c41a-4973-88ae-3d5ae4e4ec1c', '{age, life_situation_meters, municipality_code}'),
    -- Mock service, some attributes supported
    ('f4eda39d-92ba-40cd-ae4a-a524e586969f', '{age, life_situation_meters}'),
    -- Mock service, all attributes supported
    ('0ba11195-de64-43b3-af64-41aba7285364', '{age, life_situation_meters, municipality_code}')
on conflict (ptv_service_channel_id) do update set supported_attributes = excluded.supported_attributes;
