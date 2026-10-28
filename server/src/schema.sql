CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'Compliance Officer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  short_name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- NOTE: no IP address, user agent, or any reporter identity is ever stored.
CREATE TABLE IF NOT EXISTS complaints (
  id                SERIAL PRIMARY KEY,
  reference         TEXT UNIQUE NOT NULL,
  category_id       INT NOT NULL REFERENCES categories(id),
  center            TEXT,
  occurrence        TEXT,
  subject           TEXT NOT NULL,
  narrative         TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','under_review','in_progress','resolved')),
  escalated         BOOLEAN NOT NULL DEFAULT false,
  priority          TEXT NOT NULL DEFAULT 'standard'
                    CHECK (priority IN ('standard','high','critical')),
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_response_at TIMESTAMPTZ,
  resolved_at       TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_complaints_status    ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category  ON complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_submitted ON complaints(submitted_at DESC);

CREATE TABLE IF NOT EXISTS complaint_events (
  id           SERIAL PRIMARY KEY,
  complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  status       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_complaint ON complaint_events(complaint_id);

CREATE TABLE IF NOT EXISTS responses (
  id           SERIAL PRIMARY KEY,
  complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  author_type  TEXT NOT NULL CHECK (author_type IN ('admin','reporter')),
  responder    TEXT,
  body         TEXT NOT NULL,
  next_step    TEXT,
  signature    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_responses_complaint ON responses(complaint_id);

CREATE TABLE IF NOT EXISTS attachments (
  id           SERIAL PRIMARY KEY,
  complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  mime         TEXT NOT NULL,
  size_bytes   INT NOT NULL,
  storage_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_complaint ON attachments(complaint_id);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
