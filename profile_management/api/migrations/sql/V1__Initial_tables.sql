CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE session_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_attributes JSON NOT NULL
);

CREATE TABLE access_token (
  access_token BYTEA PRIMARY KEY,
  expiration_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '24 hour'),
  session_attributes_id UUID NOT NULL REFERENCES session_attributes(id),
  aurora_ai_service_id UUID NOT NULL
);

CREATE TABLE aurora_ai_service (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ptv_service_channel_id UUID UNIQUE
);