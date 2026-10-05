-- Migration 003: a class's colour is chosen separately from its name.
-- Stored as a hex code such as #FFD166. NULL (every class created before
-- this change) means "use the colour that matches the name" (Yellow, Green,
-- Red, Blue, Orange), so existing classes look the same. For databases
-- created before this change (local imizamo_dev, Azure). Safe to run more
-- than once. Run after 002.

BEGIN;

ALTER TABLE school_classes
  ADD COLUMN IF NOT EXISTS colour varchar(7)
  CHECK (colour IS NULL OR colour ~ '^#[0-9A-Fa-f]{6}$');

COMMIT;
