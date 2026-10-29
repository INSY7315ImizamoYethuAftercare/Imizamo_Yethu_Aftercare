-- Migration 001: managers can sign learners out (BUG-22).
-- For databases created before this change (local imizamo_dev, Azure).
-- Safe to run more than once. Fresh databases get this from schema.sql.

BEGIN;

ALTER TABLE sign_out_records ALTER COLUMN teacher_id DROP NOT NULL;

ALTER TABLE sign_out_records
  ADD COLUMN IF NOT EXISTS manager_id integer REFERENCES managers(manager_id) ON DELETE RESTRICT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_signout_recorded_by') THEN
    ALTER TABLE sign_out_records
      ADD CONSTRAINT chk_signout_recorded_by CHECK ((teacher_id IS NULL) <> (manager_id IS NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_signout_manager_id ON sign_out_records USING btree (manager_id);

COMMIT;
