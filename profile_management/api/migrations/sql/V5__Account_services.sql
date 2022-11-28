CREATE TABLE "connected_services" (
    "username" text NOT NULL,
    "aurora_ai_service_id" UUID NOT NULL REFERENCES aurora_ai_service(id),
    PRIMARY KEY ("username", "aurora_ai_service_id")
);