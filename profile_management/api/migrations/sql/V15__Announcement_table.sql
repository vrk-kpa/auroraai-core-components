CREATE TABLE announcement (
  id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  announcement_title jsonb,
  announcement_description jsonb,
  announcement_start TIMESTAMPTZ NOT NULL,
  announcement_end TIMESTAMPTZ NOT NULL
);