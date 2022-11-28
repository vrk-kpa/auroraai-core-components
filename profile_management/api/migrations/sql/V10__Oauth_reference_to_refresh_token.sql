DROP TABLE "oauth_access_token";
DROP TABLE "oauth_refresh_token";

CREATE TABLE "oauth_token_pair" (
    "refresh_token" BYTEA PRIMARY KEY,
    "access_token" BYTEA UNIQUE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "auth_time" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "refresh_expiration_time" TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '100 day',
    "access_expiration_time" TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '1 hour',
    "username" UUID NOT NULL,
    "aurora_ai_service_id" UUID NOT NULL REFERENCES aurora_ai_service(id),
    "refresh_token_scopes" varchar[] NOT NULL,
    "access_token_scopes" varchar[] NOT NULL
);

CREATE INDEX oauth_token_refresh_token_pkey ON oauth_token_pair USING hash (refresh_token);
CREATE INDEX oauth_token_access_token_index ON oauth_token_pair USING hash (access_token);
