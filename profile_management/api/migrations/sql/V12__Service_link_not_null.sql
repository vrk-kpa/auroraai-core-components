UPDATE "aurora_ai_service"
    SET "link" = ROW('', '', '')
    WHERE "link" IS NULL;

ALTER TABLE "aurora_ai_service"
    ALTER COLUMN "link" SET DEFAULT ROW('', '', ''),
    ALTER COLUMN "link" SET NOT NULL;
