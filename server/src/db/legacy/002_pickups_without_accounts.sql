-- Migration 002: parents register their child's authorised pickups.
-- A pickup person no longer needs a login account, and each pickup records
-- which parent added it. For databases created before this change (local
-- imizamo_dev, Azure). Safe to run more than once. Run after 001.

BEGIN;

ALTER TABLE guardians ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE pickup_permissions
  ADD COLUMN IF NOT EXISTS added_by_guardian_id integer REFERENCES guardians(guardian_id) ON DELETE SET NULL;

COMMIT;
