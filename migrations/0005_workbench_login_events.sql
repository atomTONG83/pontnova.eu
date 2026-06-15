PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS login_events (
  id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  success INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  colo TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_login_events_occurred ON login_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_success ON login_events(success, occurred_at DESC);
