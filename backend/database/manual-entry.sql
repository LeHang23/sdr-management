-- Copy only the statements you need into a SQLite editor connected to
-- backend/data/sdr-management.db. Keep source = 'manual' for simulator input.

-- Add or update one simulated SDR device.
INSERT INTO devices (
  id,
  display_name,
  source,
  connection_status,
  health_status,
  last_seen_at
) VALUES (
  'SDR-NEW-001',
  'SDR-NEW-001',
  'manual',
  'online',
  'online',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(id) DO UPDATE SET
  display_name = excluded.display_name,
  source = excluded.source,
  connection_status = excluded.connection_status,
  health_status = excluded.health_status,
  last_seen_at = excluded.last_seen_at,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

-- Add or update an active issue. A critical active issue puts its device into
-- the Fleet Summary "Needs attention" count exactly once.
INSERT INTO device_issues (id, device_id, severity, status, summary)
VALUES ('ISS-MANUAL-001', 'SDR-NEW-001', 'critical', 'active', 'Manual simulator issue')
ON CONFLICT(id) DO UPDATE SET
  severity = excluded.severity,
  status = excluded.status,
  summary = excluded.summary,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

-- Add or update a reconfiguration job. Active job statuses are queued,
-- deploying, verifying, and retrying.
INSERT INTO reconfiguration_jobs (id, source, status)
VALUES ('RC-MANUAL-001', 'manual', 'queued')
ON CONFLICT(id) DO UPDATE SET
  source = excluded.source,
  status = excluded.status,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

-- Add or update one telemetry sample. Either Throughput or SNR may be NULL
-- when a device reports only part of a sample, but both cannot be NULL.
INSERT INTO device_telemetry (
  device_id,
  sampled_at,
  source,
  throughput_mbps,
  snr_db
) VALUES (
  'SDR-NEW-001',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  'manual',
  64.2,
  21.8
)
ON CONFLICT(device_id, sampled_at) DO UPDATE SET
  source = excluded.source,
  throughput_mbps = excluded.throughput_mbps,
  snr_db = excluded.snr_db;
