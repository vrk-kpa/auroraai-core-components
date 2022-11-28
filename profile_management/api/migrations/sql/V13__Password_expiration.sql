CREATE TABLE password_change (
  username UUID NOT NULL,
  set_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_language text NOT NULL,
  PRIMARY KEY ("username")
);
