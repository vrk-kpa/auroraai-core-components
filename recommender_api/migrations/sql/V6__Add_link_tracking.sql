CREATE TABLE service_recommender.recommendation_redirect (
  id SERIAL PRIMARY KEY,
  recommendation_id bigint,
  service_id text,
  service_channel_id text REFERENCES service_recommender.service_channel(service_channel_id),
  redirect_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_redirect FOREIGN KEY(recommendation_id, service_id) REFERENCES service_recommender.recommendation_service(recommendation_id, service_id)
);