ALTER TABLE "oauth_refresh_token" ADD COLUMN "created_at" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "oauth_access_token" ADD COLUMN "created_at" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "oauth_authorization_code" ADD COLUMN "created_at" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "oauth_authorization_code" ADD COLUMN "auth_time" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "oauth_refresh_token" ADD COLUMN "auth_time" timestamp with time zone NOT NULL DEFAULT now();
