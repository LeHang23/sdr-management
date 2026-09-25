PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'sdr_gateway')),
  connection_status TEXT NOT NULL CHECK (connection_status IN ('online', 'offline')),
  health_status TEXT NOT NULL CHECK (health_status IN ('online', 'warning', 'offline', 'updating')),
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS device_issues (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved')),
  summary TEXT NOT NULL,
  opened_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS reconfiguration_jobs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'sdr_gateway')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'deploying', 'verifying', 'retrying', 'succeeded', 'failed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS device_telemetry (
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  sampled_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'sdr_gateway')),
  throughput_mbps REAL CHECK (throughput_mbps IS NULL OR throughput_mbps >= 0),
  snr_db REAL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (device_id, sampled_at),
  CHECK (throughput_mbps IS NOT NULL OR snr_db IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS device_telemetry_sampled_at_idx
ON device_telemetry (sampled_at);

CREATE TABLE IF NOT EXISTS overview_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO overview_metadata (key, value) VALUES ('revision', '0');

CREATE TRIGGER IF NOT EXISTS devices_revision_after_insert
AFTER INSERT ON devices
BEGIN
  UPDATE overview_metadata
  SET value = CAST(value AS INTEGER) + 1,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS devices_revision_after_update
AFTER UPDATE ON devices
BEGIN
  UPDATE overview_metadata
  SET value = CAST(value AS INTEGER) + 1,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS devices_revision_after_delete
AFTER DELETE ON devices
BEGIN
  UPDATE overview_metadata
  SET value = CAST(value AS INTEGER) + 1,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS device_issues_revision_after_insert
AFTER INSERT ON device_issues
BEGIN
  UPDATE overview_metadata SET value = CAST(value AS INTEGER) + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS device_issues_revision_after_update
AFTER UPDATE ON device_issues
BEGIN
  UPDATE overview_metadata SET value = CAST(value AS INTEGER) + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS device_issues_revision_after_delete
AFTER DELETE ON device_issues
BEGIN
  UPDATE overview_metadata SET value = CAST(value AS INTEGER) + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS jobs_revision_after_insert
AFTER INSERT ON reconfiguration_jobs
BEGIN
  UPDATE overview_metadata SET value = CAST(value AS INTEGER) + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS jobs_revision_after_update
AFTER UPDATE ON reconfiguration_jobs
BEGIN
  UPDATE overview_metadata SET value = CAST(value AS INTEGER) + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS jobs_revision_after_delete
AFTER DELETE ON reconfiguration_jobs
BEGIN
  UPDATE overview_metadata SET value = CAST(value AS INTEGER) + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS telemetry_revision_after_insert
AFTER INSERT ON device_telemetry
BEGIN
  UPDATE overview_metadata SET value = CAST(value AS INTEGER) + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS telemetry_revision_after_update
AFTER UPDATE ON device_telemetry
BEGIN
  UPDATE overview_metadata SET value = CAST(value AS INTEGER) + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'revision';
END;

CREATE TRIGGER IF NOT EXISTS telemetry_revision_after_delete
AFTER DELETE ON device_telemetry
BEGIN
  UPDATE overview_metadata SET value = CAST(value AS INTEGER) + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'revision';
END;
