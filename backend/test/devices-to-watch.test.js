import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { migrateDatabase } from '../src/database.js';
import { getOverviewSummary } from '../src/overview-summary.js';

function fixture() {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  migrateDatabase(database);
  const device = (id, status, updatedAt = '2026-09-01T00:00:00Z', lastSeen = null) => {
    database.prepare(`INSERT INTO devices (id, display_name, connection_status, health_status, updated_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?)`).run(id, `Name ${id}`, status === 'offline' ? 'offline' : 'online', status, updatedAt, lastSeen);
  };
  const issue = (id, deviceId, severity, status, updatedAt, summary = id) => {
    database.prepare(`INSERT INTO device_issues (id, device_id, severity, status, updated_at, summary)
      VALUES (?, ?, ?, ?, ?, ?)`).run(id, deviceId, severity, status, updatedAt, summary);
  };
  return { database, device, issue };
}

test('watch list is empty for an empty or healthy fleet, including resolved critical issues', () => {
  const { database, device, issue } = fixture();
  try {
    assert.deepEqual(getOverviewSummary(database).details.devicesToWatch, { total: 0, limit: 5, items: [] });
    device('healthy', 'online');
    device('updating', 'updating');
    issue('resolved', 'healthy', 'critical', 'resolved', '2026-09-02T00:00:00Z');
    issue('warning', 'updating', 'warning', 'active', '2026-09-02T00:00:00Z');
    assert.equal(getOverviewSummary(database).details.devicesToWatch.total, 0);
  } finally { database.close(); }
});

test('includes critical issues on healthy/updating devices, deduplicates, and prioritizes severity then recency', () => {
  const { database, device, issue } = fixture();
  try {
    device('warning', 'warning', '2026-10-01T00:00:00Z');
    device('offline-old', 'offline', '2026-09-01T00:00:00Z');
    device('offline-new', 'offline', '2026-09-02T00:00:00Z', '2026-09-01T23:59:00Z');
    device('critical', 'online');
    device('updating-critical', 'updating');
    issue('critical-old', 'critical', 'critical', 'active', '2026-09-03T00:00:00Z');
    issue('critical-new', 'critical', 'critical', 'active', '2026-09-04T00:00:00Z', '<img onerror="alert(1)">');
    issue('less-severe', 'critical', 'warning', 'active', '2026-10-01T00:00:00Z');
    issue('update-issue', 'updating-critical', 'critical', 'active', '2026-09-05T00:00:00Z');
    const snapshot = getOverviewSummary(database);
    const watch = snapshot.details.devicesToWatch;
    assert.equal(watch.total, snapshot.metrics.needsAttention);
    assert.equal(watch.total, 5);
    assert.deepEqual(watch.items.map((item) => item.deviceId),
      ['updating-critical', 'critical', 'offline-new', 'offline-old', 'warning']);
    assert.equal(watch.items[1].issueSummary, '<img onerror="alert(1)">');
    assert.equal(watch.items[1].displayName, 'Name critical');
    assert.equal(watch.items[2].lastSeenAt, '2026-09-01T23:59:00Z');
    assert.equal(watch.items[2].issueSummary, 'Device is offline');
    assert.equal(watch.items[3].lastSeenAt, null);
    assert.equal(watch.items[4].issueSummary, 'Device health requires attention');
    issue('resolved-newest', 'critical', 'critical', 'resolved', '2026-11-01T00:00:00Z');
    assert.equal(getOverviewSummary(database).details.devicesToWatch.items[1].issueSummary, '<img onerror="alert(1)">');
  } finally { database.close(); }
});

test('caps the preview at five with a full total, deterministic ties, and reflects recovery', () => {
  const { database, device } = fixture();
  try {
    for (let index = 8; index >= 1; index--) device(`device-${index}`, 'warning');
    const before = getOverviewSummary(database);
    assert.equal(before.details.devicesToWatch.total, 8);
    assert.deepEqual(before.details.devicesToWatch.items.map((item) => item.deviceId),
      ['device-1', 'device-2', 'device-3', 'device-4', 'device-5']);
    database.exec("UPDATE devices SET health_status = 'online' WHERE id = 'device-1'");
    const after = getOverviewSummary(database);
    assert.notEqual(after.snapshotId, before.snapshotId);
    assert.equal(after.metrics.needsAttention, 7);
    assert.equal(after.details.devicesToWatch.total, 7);
    assert.equal(after.details.devicesToWatch.items[0].deviceId, 'device-2');
  } finally { database.close(); }
});
