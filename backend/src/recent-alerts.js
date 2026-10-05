import { randomUUID } from 'node:crypto';

export const RECENT_ALERTS_LIMIT = 3;

export function migrateRecentAlerts(database) {
  const columns = database.prepare('PRAGMA table_info(device_issues)').all();
  if (!columns.some((column) => column.name === 'kind')) {
    database.exec(`ALTER TABLE device_issues ADD COLUMN kind TEXT NOT NULL DEFAULT 'manual'
      CHECK (kind IN ('manual', 'gateway_health'));`);
  }
  database.exec(`CREATE UNIQUE INDEX IF NOT EXISTS device_issues_active_gateway_health_idx
    ON device_issues (device_id) WHERE kind = 'gateway_health' AND status = 'active';
    CREATE INDEX IF NOT EXISTS device_issues_opened_at_idx ON device_issues (opened_at);`);
}

// Caller owns the device/telemetry write transaction. Manual findings are untouched.
export function syncGatewayHealthAlert(database, deviceId, healthStatus, occurredAt) {
  const finding = healthStatus === 'warning'
    ? { severity: 'warning', summary: 'Device reported Warning health' }
    : healthStatus === 'offline'
      ? { severity: 'critical', summary: 'Device is Offline' }
      : null;
  const active = database.prepare(`SELECT id, severity, summary FROM device_issues
    WHERE device_id = ? AND kind = 'gateway_health' AND status = 'active'`).get(deviceId);
  if (active && finding && active.severity === finding.severity && active.summary === finding.summary) return;
  if (active) {
    database.prepare(`UPDATE device_issues SET status = 'resolved', updated_at = ? WHERE id = ?`)
      .run(occurredAt, active.id);
  }
  if (finding) {
    database.prepare(`INSERT INTO device_issues
      (id, device_id, kind, severity, status, summary, opened_at, updated_at)
      VALUES (?, ?, 'gateway_health', ?, 'active', ?, ?, ?)`)
      .run(`ISS-GATEWAY-${randomUUID()}`, deviceId, finding.severity, finding.summary, occurredAt, occurredAt);
  }
}

export function getRecentAlerts(database) {
  const counts = database.prepare(`SELECT COUNT(*) AS total,
    COALESCE(SUM(status = 'active'), 0) AS unresolved FROM device_issues`).get();
  const rows = database.prepare(`SELECT issue.*, device.display_name, device.source
    FROM device_issues AS issue JOIN devices AS device ON device.id = issue.device_id
    ORDER BY julianday(issue.opened_at) DESC, issue.id ASC LIMIT ?`).all(RECENT_ALERTS_LIMIT);
  return {
    total: Number(counts.total),
    unresolved: Number(counts.unresolved),
    limit: RECENT_ALERTS_LIMIT,
    items: rows.map((row) => {
      const mode = row.source === 'manual' ? 'manual' : row.device_id.startsWith('SIM-SDR-') ? 'simulator' : 'sdr_gateway';
      return {
        alertId: row.id,
        deviceId: row.device_id,
        displayName: row.display_name,
        severity: row.severity,
        status: row.status,
        summary: row.summary,
        occurredAt: row.opened_at,
        updatedAt: row.updated_at,
        source: {
          mode,
          label: mode === 'manual' ? 'Manual database input' : mode === 'simulator' ? 'Remote device simulator' : 'SDR Gateway',
        },
      };
    }),
  };
}
