-- Optional manual demo data. It is idempotent and never overwrites existing rows.
INSERT OR IGNORE INTO devices (id, display_name, source, connection_status, health_status, created_at) VALUES
  ('SDR-001', 'SDR-001', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-002', 'SDR-002', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-003', 'SDR-003', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-004', 'SDR-004', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-005', 'SDR-005', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-006', 'SDR-006', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-007', 'SDR-007', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-008', 'SDR-008', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-009', 'SDR-009', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-010', 'SDR-010', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-011', 'SDR-011', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-012', 'SDR-012', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-013', 'SDR-013', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-014', 'SDR-014', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-015', 'SDR-015', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-016', 'SDR-016', 'manual', 'online', 'online', '2026-07-05T09:00:00.000Z'),
  ('SDR-017', 'SDR-017', 'manual', 'online', 'warning', '2026-07-05T09:00:00.000Z'),
  ('SDR-018', 'SDR-018', 'manual', 'online', 'warning', '2026-07-05T09:00:00.000Z'),
  ('SDR-019', 'SDR-019', 'manual', 'online', 'warning', '2026-07-05T09:00:00.000Z'),
  ('SDR-020', 'SDR-020', 'manual', 'offline', 'offline', '2026-07-05T09:00:00.000Z'),
  ('SDR-021', 'SDR-021', 'manual', 'offline', 'offline', '2026-07-05T09:00:00.000Z'),
  ('SDR-022', 'SDR-022', 'manual', 'offline', 'updating', '2026-08-03T09:00:00.000Z'),
  ('SDR-023', 'SDR-023', 'manual', 'offline', 'updating', '2026-08-12T09:00:00.000Z'),
  ('SDR-024', 'SDR-024', 'manual', 'offline', 'updating', '2026-08-20T09:00:00.000Z');

INSERT OR IGNORE INTO device_issues (id, device_id, severity, status, summary) VALUES
  ('ISS-001', 'SDR-017', 'critical', 'active', 'SNR below operating threshold');

INSERT OR IGNORE INTO reconfiguration_jobs (id, source, status) VALUES
  ('RC-106', 'manual', 'deploying'),
  ('RC-107', 'manual', 'deploying'),
  ('RC-108', 'manual', 'verifying');
