import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { migrateDatabase, seedDatabase } from '../src/database.js';
import { ingestGatewayHeartbeat, expireStaleGatewayDevices } from '../src/gateway-ingestion.js';
import { getOverviewSummary } from '../src/overview-summary.js';

function fixture(t) {
  const database = new DatabaseSync(':memory:');
  migrateDatabase(database);
  t.after(() => database.close());
  return database;
}

const alerts = (database) => getOverviewSummary(database).details.recentAlerts;
const heartbeat = (database, state, at, id = 'SIM-SDR-001') =>
  ingestGatewayHeartbeat(database, id, { healthStatus: state }, at);

test('empty alerts are valid; legacy migration and repeated seed preserve manual findings', (t) => {
  const database = fixture(t);
  assert.deepEqual(alerts(database), { total: 0, unresolved: 0, limit: 3, items: [] });
  const legacy = new DatabaseSync(':memory:');
  t.after(() => legacy.close());
  legacy.exec(readFileSync(new URL('../database/schema.sql', import.meta.url), 'utf8'));
  legacy.exec(`INSERT INTO devices (id, display_name, connection_status, health_status)
    VALUES ('manual', 'Manual device', 'online', 'online');
    INSERT INTO device_issues (id, device_id, severity, status, summary)
    VALUES ('legacy', 'manual', 'info', 'resolved', 'Existing finding');`);
  migrateDatabase(legacy);
  migrateDatabase(legacy);
  seedDatabase(legacy);
  legacy.exec("UPDATE device_issues SET summary = 'Operator edited' WHERE id = 'ISS-001'");
  seedDatabase(legacy);
  assert.equal(legacy.prepare("SELECT kind FROM device_issues WHERE id = 'legacy'").get().kind, 'manual');
  assert.equal(legacy.prepare("SELECT summary FROM device_issues WHERE id = 'ISS-001'").get().summary, 'Operator edited');
  assert.equal(alerts(legacy).total, 2);
});

test('Warning heartbeats deduplicate across migrations; recovery preserves history and recurrence opens a new incident', (t) => {
  const database = fixture(t);
  heartbeat(database, 'warning', '2026-10-05T10:00:00Z');
  const first = alerts(database).items[0];
  heartbeat(database, 'warning', '2026-10-05T10:01:00Z');
  migrateDatabase(database);
  heartbeat(database, 'warning', '2026-10-05T10:02:00Z');
  assert.equal(alerts(database).total, 1);
  assert.equal(alerts(database).items[0].occurredAt, first.occurredAt);
  assert.equal(alerts(database).items[0].updatedAt, first.updatedAt);
  assert.deepEqual(first.source, { mode: 'simulator', label: 'Remote device simulator' });
  database.exec(`INSERT INTO device_issues (id, device_id, severity, status, summary)
    VALUES ('manual-critical', 'SIM-SDR-001', 'critical', 'active', 'Operator finding');`);
  heartbeat(database, 'online', '2026-10-05T10:03:00Z');
  assert.equal(database.prepare('SELECT status FROM device_issues WHERE id = ?').get(first.alertId).status, 'resolved');
  assert.equal(database.prepare("SELECT status FROM device_issues WHERE id = 'manual-critical'").get().status, 'active');
  heartbeat(database, 'warning', '2026-10-05T10:04:00Z');
  const generated = database.prepare("SELECT * FROM device_issues WHERE kind = 'gateway_health' ORDER BY opened_at DESC").all();
  assert.equal(generated.length, 2);
  assert.notEqual(generated[0].id, first.alertId);
  assert.equal(generated[0].status, 'active');
});

test('expiry records Offline once; Warning/Offline transitions and Updating recovery resolve only generated incidents', (t) => {
  const database = fixture(t);
  heartbeat(database, 'warning', '2026-10-05T10:00:00Z');
  assert.equal(expireStaleGatewayDevices(database, '2026-10-05T10:01:00Z'), 1);
  assert.equal(expireStaleGatewayDevices(database, '2026-10-05T10:01:00Z'), 0);
  const snapshot = getOverviewSummary(database);
  assert.equal(snapshot.metrics.needsAttention, 1);
  assert.equal(snapshot.details.recentAlerts.total, 2);
  assert.equal(snapshot.details.recentAlerts.unresolved, 1);
  const offline = database.prepare("SELECT * FROM device_issues WHERE status = 'active'").get();
  assert.equal(offline.severity, 'critical');
  assert.equal(snapshot.details.devicesToWatch.items[0].issueSummary, offline.summary);
  heartbeat(database, 'offline', '2026-10-05T10:02:00Z');
  assert.equal(alerts(database).total, 2);
  heartbeat(database, 'warning', '2026-10-05T10:03:00Z');
  assert.equal(alerts(database).total, 3);
  assert.equal(alerts(database).unresolved, 1);
  heartbeat(database, 'updating', '2026-10-05T10:04:00Z');
  assert.equal(alerts(database).unresolved, 0);
});

test('recent alerts are newest-first including resolved/info, limited to three, with full unresolved count and per-item sources', (t) => {
  const database = fixture(t);
  database.exec(`INSERT INTO devices (id, display_name, source, connection_status, health_status) VALUES
    ('manual', 'Manual device', 'manual', 'online', 'online'),
    ('SIM-SDR-001', 'Demo device', 'sdr_gateway', 'online', 'online'),
    ('SDR-real', 'Gateway device', 'sdr_gateway', 'online', 'online');
    INSERT INTO device_issues (id, device_id, severity, status, summary, opened_at, updated_at) VALUES
    ('old', 'manual', 'critical', 'active', 'Older critical', '2026-10-01T10:00:00Z', '2026-10-06T10:00:00Z'),
    ('a', 'manual', 'info', 'resolved', '<img onerror="alert(1)">', '2026-10-05T10:00:00Z', '2026-10-05T10:01:00Z'),
    ('b', 'SIM-SDR-001', 'warning', 'active', 'Warning', '2026-10-05T10:00:00Z', '2026-10-05T10:00:00Z'),
    ('c', 'SDR-real', 'critical', 'active', 'Critical', '2026-10-05T10:00:00Z', '2026-10-05T10:00:00Z');`);
  const recent = alerts(database);
  assert.equal(recent.total, 4);
  assert.equal(recent.unresolved, 3);
  assert.deepEqual(recent.items.map((item) => item.alertId), ['a', 'b', 'c']);
  assert.deepEqual(recent.items.map((item) => item.source.mode), ['manual', 'simulator', 'sdr_gateway']);
  assert.equal(recent.items[0].summary, '<img onerror="alert(1)">');
  const before = getOverviewSummary(database).snapshotId;
  database.exec("UPDATE device_issues SET status = 'resolved' WHERE id = 'b'");
  assert.notEqual(getOverviewSummary(database).snapshotId, before);
  assert.equal(alerts(database).unresolved, 2);
  assert.deepEqual(alerts(database).items.map((item) => item.alertId), ['a', 'b', 'c']);
});

test('failed incident persistence rolls back heartbeat, telemetry and expiry together', (t) => {
  const database = fixture(t);
  database.exec(`CREATE TRIGGER reject_test_alert BEFORE INSERT ON device_issues
    BEGIN SELECT RAISE(ABORT, 'test persistence failure'); END;`);
  assert.throws(() => ingestGatewayHeartbeat(database, 'SIM-SDR-001', {
    healthStatus: 'warning', telemetry: { snrDb: 12 },
  }), /test persistence failure/);
  assert.equal(getOverviewSummary(database).metrics.totalDevices, 0);
  assert.equal(database.prepare('SELECT COUNT(*) AS n FROM device_telemetry').get().n, 0);
  heartbeat(database, 'online', '2026-10-05T10:00:00Z');
  assert.throws(() => expireStaleGatewayDevices(database, '2026-10-05T10:01:00Z'), /test persistence failure/);
  assert.equal(database.prepare('SELECT connection_status FROM devices').get().connection_status, 'online');
  assert.equal(alerts(database).total, 0);
});
