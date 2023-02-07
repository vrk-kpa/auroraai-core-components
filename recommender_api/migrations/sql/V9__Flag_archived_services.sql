ALTER TABLE service_recommender.service ADD COLUMN archived BOOLEAN DEFAULT FALSE;
ALTER TABLE service_recommender.service_channel ADD COLUMN archived BOOLEAN DEFAULT FALSE;