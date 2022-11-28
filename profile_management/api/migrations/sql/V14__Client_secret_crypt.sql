CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE aurora_ai_service 
  SET oauth_client_secret = crypt(oauth_client_secret, gen_salt('bf')) 
  WHERE oauth_client_secret IS NOT null;