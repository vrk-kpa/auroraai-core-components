TRUNCATE table service_recommender.recommendation_service_feedback;
 
ALTER TABLE service_recommender.recommendation_service_feedback
ADD CONSTRAINT recommendation_service_feedback_service_id_fkey
  FOREIGN KEY (recommendation_id, service_id)
  REFERENCES service_recommender.recommendation_service(recommendation_id, service_id)
  ON DELETE CASCADE;