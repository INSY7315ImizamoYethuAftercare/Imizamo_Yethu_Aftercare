-- Up Migration

-- The manager's sign-out queue. A collection staff couldn't verify (a name
-- not on the pickup list, or walking home without permission) waits here for
-- a manager to approve or dismiss it.
CREATE TABLE signout_escalations (
  escalation_id serial PRIMARY KEY,
  learner_id integer NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
  record_date date NOT NULL,
  -- NULL means the learner wants to walk home alone without permission.
  collector_name varchar(150),
  raised_by_teacher_id integer REFERENCES teachers(teacher_id) ON DELETE RESTRICT,
  raised_by_manager_id integer REFERENCES managers(manager_id) ON DELETE RESTRICT,
  raised_at timestamptz NOT NULL DEFAULT now(),
  status varchar(20) NOT NULL DEFAULT 'open',
  resolved_by_manager_id integer REFERENCES managers(manager_id) ON DELETE RESTRICT,
  resolved_at timestamptz,
  CONSTRAINT chk_escalation_raised_by CHECK ((raised_by_teacher_id IS NULL) <> (raised_by_manager_id IS NULL)),
  CONSTRAINT chk_escalation_status CHECK (status IN ('open', 'approved', 'dismissed')),
  CONSTRAINT chk_escalation_resolved CHECK ((status = 'open') = (resolved_at IS NULL))
);
CREATE INDEX idx_escalation_record_date ON signout_escalations USING btree (record_date);
-- A learner can only be waiting in the queue once at a time.
CREATE UNIQUE INDEX uq_escalation_open_learner ON signout_escalations (learner_id, record_date) WHERE status = 'open';

-- An approved collector isn't on the pickup list, so has no guardian record.
-- guardian_id NULL with no collector_name still means walked home alone.
ALTER TABLE sign_out_records ADD COLUMN collector_name varchar(150);

-- Down Migration
ALTER TABLE sign_out_records DROP COLUMN collector_name;
DROP TABLE signout_escalations;
