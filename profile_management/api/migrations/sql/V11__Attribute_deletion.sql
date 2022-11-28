CREATE TABLE attribute_deletion (
  username UUID NOT NULL,
  aurora_ai_service_id UUID NOT NULL REFERENCES aurora_ai_service(id),
  initiated_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("username", "aurora_ai_service_id")
);
