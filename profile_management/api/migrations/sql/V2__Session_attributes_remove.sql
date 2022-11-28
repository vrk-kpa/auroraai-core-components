ALTER TABLE access_token
DROP CONSTRAINT access_token_session_attributes_id_fkey,
ADD CONSTRAINT access_token_session_attributes_id_fkey
  FOREIGN KEY (session_attributes_id)
  REFERENCES session_attributes(id)
  ON DELETE CASCADE;