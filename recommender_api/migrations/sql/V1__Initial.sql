--// Required for test DB
CREATE schema if not exists service_recommender;

CREATE TABLE IF NOT EXISTS service_recommender.service_vectors (
	service_id text PRIMARY KEY,
	municipality_code text,
	health int,
	resilience int,
	housing int,
	working_studying int,
	family int,
	friends int,
	finance int,
	improvement_of_strengths int,
	self_esteem int,
	life_satisfaction int
);

CREATE TABLE IF NOT EXISTS service_recommender.service (
  service_id         text PRIMARY KEY,
    service_type text,
    area_type text,
    areas_type text,
    service_name text,
    description_summary text,
    description text,
    user_instruction text,
    service_charge_type text,
    charge_type_additional_info text,
    target_groups text,
    service_class_name text,
    service_class_description text,
    ontology_terms text,
    life_events text,
    industrial_classes text,
    service_channels text,
    municipality_codes text,
    municipality_names text,
  service_data       jsonb,
  textsearchable_index_col tsvector
);

CREATE INDEX textsearch_idx ON service_recommender.service USING GIN (textsearchable_index_col);

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON service_recommender.service FOR EACH ROW EXECUTE PROCEDURE
tsvector_update_trigger(textsearchable_index_col, 'pg_catalog.finnish', 
   service_id,
    service_type,
    area_type,
    areas_type,
    service_name,
    description_summary,
    description,
    user_instruction,
    service_charge_type,
    charge_type_additional_info,
    target_groups,
    service_class_name,
    service_class_description,
    ontology_terms,
    life_events,
    industrial_classes,
    service_channels,
    municipality_names,
    municipality_codes  );


CREATE TABLE IF NOT EXISTS service_recommender.recommendation (
    recommendation_id bigserial PRIMARY KEY,
    session_id text,
    calling_organisation text,
    calling_service text,
    recommendation_time timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS service_recommender.recommendation_service (
    recommendation_id bigint REFERENCES service_recommender.recommendation(recommendation_id),
    service_id text,  --references to service table, but the table can be truncated
    CONSTRAINT recommendation_service_pkey PRIMARY KEY (recommendation_id, service_id)
);

CREATE TABLE IF NOT EXISTS service_recommender.recommendation_attributes (
    recommendation_id bigint REFERENCES service_recommender.recommendation(recommendation_id),
    attributes jsonb,
    CONSTRAINT recommendation_attribute_pkey PRIMARY KEY (recommendation_id)
);

CREATE TABLE IF NOT EXISTS service_recommender.recommendation_feedback (
    recommendation_id bigint REFERENCES service_recommender.recommendation(recommendation_id),
    feedback_score integer
);

CREATE TABLE IF NOT EXISTS service_recommender.recommendation_service_feedback (
    recommendation_id bigint REFERENCES service_recommender.recommendation(recommendation_id),
    service_id text,  --references to service table, but the table can be truncated
    feedback_score integer
);
