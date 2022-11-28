ALTER TABLE "aurora_ai_service"
    ADD COLUMN "allowed_scopes" varchar[] NOT NULL DEFAULT array[]::varchar[],
    ADD COLUMN "allowed_redirect_uris" varchar[] NOT NULL DEFAULT array[]::varchar[],
    ADD COLUMN "default_redirect_uri" varchar,  -- a NULL redirect URI effectively prevents the service
                                                -- from using OAuth as a default value is required by the OAuth 2.0 spec
    ADD COLUMN "oauth_client_secret" varchar,
    ADD COLUMN "data_provider_url" varchar;

ALTER TABLE "aurora_ai_service" RENAME COLUMN "supported_attributes" TO "session_transfer_receivable_attributes"; -- clarifies the use of this column to be only related to receiving session transfer attributes

CREATE TABLE "oauth_authorization_code" (
    "code" BYTEA PRIMARY KEY,
    "expiration_time" TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '10 minute',
    "username" UUID NOT NULL,
    "aurora_ai_service_id" UUID NOT NULL REFERENCES aurora_ai_service(id),
    "redirect_uri" varchar,
    "scopes" varchar[] NOT NULL
);

CREATE TABLE "oauth_access_token" (
    "token" BYTEA PRIMARY KEY,
    "expiration_time" TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '1 hour',
    "username" UUID NOT NULL,
    "aurora_ai_service_id" UUID NOT NULL REFERENCES aurora_ai_service(id),
    "scopes" varchar[] NOT NULL
);

CREATE TABLE "oauth_refresh_token" (
    "token" BYTEA PRIMARY KEY,
    "expiration_time" TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '100 day',
    "username" UUID NOT NULL,
    "aurora_ai_service_id" UUID NOT NULL REFERENCES aurora_ai_service(id),
    "scopes" varchar[] NOT NULL
);

CREATE TABLE "attribute_source" (
    "username" text NOT NULL,
    "aurora_ai_service_id" UUID NOT NULL REFERENCES aurora_ai_service(id),
    "attribute" varchar NOT NULL,
    PRIMARY KEY ("username", "aurora_ai_service_id", "attribute")
);

DROP TABLE "connected_services";

CREATE AGGREGATE array_concat_agg(anyarray) (
  SFUNC = array_cat,
  STYPE = anyarray
);

CREATE OR REPLACE FUNCTION uniq (ANYARRAY) RETURNS ANYARRAY
LANGUAGE SQL
AS $body$
  SELECT ARRAY(
    SELECT DISTINCT $1[s.i]
    FROM generate_series(array_lower($1,1), array_upper($1,1)) AS s(i)
    ORDER BY 1
  );
$body$;
