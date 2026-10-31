-- Migration 004: a master admin can do everything a manager can.
-- Manager features look for a managers row (and sign-outs record a
-- manager_id), so every master admin gets one, alongside their admins row.
-- For databases created before this change (local imizamo_dev, Azure).
-- Safe to run more than once. Run after 003.

BEGIN;

INSERT INTO managers (user_id, full_name)
SELECT a.user_id, a.full_name
FROM admins a
WHERE a.access_level = 'master'
  AND NOT EXISTS (SELECT 1 FROM managers m WHERE m.user_id = a.user_id);

COMMIT;
