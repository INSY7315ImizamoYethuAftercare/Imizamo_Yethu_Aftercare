-- Migration 005: safer password changes.
--  - password_changed_at: when the password last changed. A session started
--    before then is no longer accepted, so changing or resetting a password
--    signs the account out everywhere else. NULL (every account before this
--    change) means "never changed", so nobody is signed out by this migration.
--  - must_change_password: set when the master admin resets a forgotten
--    password. The user has to choose their own new password before they
--    can use the app.
-- For databases created before this change (local imizamo_dev, Azure).
-- Safe to run more than once. Run after 004.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

COMMIT;
