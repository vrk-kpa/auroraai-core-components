DROP TABLE IF EXISTS service_recommender.recommendation_attributes;

ALTER TABLE service_recommender.recommendation ADD COLUMN request_path text NOT NULL DEFAULT '';
ALTER TABLE service_recommender.recommendation ADD COLUMN request_attributes jsonb NOT NULL DEFAULT'{}'::jsonb;
