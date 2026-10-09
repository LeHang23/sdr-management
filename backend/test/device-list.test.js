import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { migrateDatabase } from '../src/database.js';
import { getDeviceList } from '../src/device-list.js';
import { getOverviewSummary } from '../src/overview-summary.js';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  migrateDatabase(db);
  t.after(() => db.close());
  const add = (id, name = id, health = 'online', connection = 'online', source = 'manual', seen = null) =>
    db.prepare('INSERT INTO devices (id, display_name, health_status, connection_status, source, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, health, connection, source, seen);
  const list = (query = '') => getDeviceList(db, new URLSearchParams(query));
  return { db, add, list };
}

test('empty fleet, literal case-insensitive search, and combined filters preserve identity and source', (t) => {
  const { add, list } = fixture(t);
  assert.equal(list().total, 0);
  assert.equal(list().pageCount, 1);
  add('MAN-1', 'Alpha%_\' <img onerror="alert(1)">', 'warning');
  add('SIM-SDR-001', 'Simulator', 'online', 'offline', 'sdr_gateway');
  add('REAL-1', 'Physical gateway', 'online', 'online', 'sdr_gateway');
  assert.equal(list('q=alpha').total, 1);
  assert.equal(list('q=man-1').total, 1);
  assert.equal(list('q=%25_').total, 1);
  assert.equal(list("q=' OR 1=1--").total, 0);
  assert.equal(list('source=simulator&connection=offline&health=online').items[0].deviceId, 'SIM-SDR-001');
  assert.equal(list('source=sdr_gateway').items[0].deviceId, 'REAL-1');
  assert.equal(list('source=manual').total, 1);
  assert.equal(list('q=missing').fleetTotal, 3);
});

test('needs attention matches Overview, deduplicates active critical issues and reflects recovery', (t) => {
  const { db, add, list } = fixture(t);
  add('warning', 'Warning', 'warning');
  add('offline', 'Offline', 'offline', 'offline');
  add('critical', 'Healthy with finding');
  add('resolved', 'Healthy recovered');
  add('updating', 'Updating critical', 'updating');
  db.exec(`INSERT INTO device_issues (id, device_id, summary, severity, status) VALUES
    ('c1', 'critical', 'one', 'critical', 'active'), ('c2', 'critical', 'two', 'critical', 'active'),
    ('r1', 'resolved', 'old', 'critical', 'resolved'), ('u1', 'updating', 'three', 'critical', 'active');`);
  assert.equal(list('attention=true').total, getOverviewSummary(db).metrics.needsAttention);
  assert.equal(list('attention=true').total, 4);
  const before = list('attention=true');
  db.exec("UPDATE device_issues SET status = 'resolved' WHERE device_id = 'critical'");
  db.exec("UPDATE devices SET health_status = 'online' WHERE id = 'warning'");
  assert.equal(list('attention=true').total, 2);
  assert.notEqual(list().snapshotId, before.snapshotId);
});

test('stable sorting, page boundaries, last seen nulls, and deletion clamp', (t) => {
  const { db, add, list } = fixture(t);
  for (let i = 24; i >= 1; i--) add(`D-${String(i).padStart(2, '0')}`, 'Same name', i === 1 ? 'offline' : 'online', 'online', 'manual', i > 2 ? `2026-10-09T10:${String(i).padStart(2, '0')}:00Z` : null);
  const first = list('pageSize=10');
  const second = list('pageSize=10&page=2');
  assert.equal(first.total, 24);
  assert.equal(first.pageCount, 3);
  assert.equal(first.items[0].deviceId, 'D-01');
  assert.equal(second.items[0].deviceId, 'D-11');
  assert.equal(list('pageSize=10&page=999').items.length, 4);
  assert.equal(list('sort=health').items[0].deviceId, 'D-01');
  assert.equal(list('sort=lastSeen&direction=desc').items[0].deviceId, 'D-24');
  assert.equal(list('sort=lastSeen').items[0].deviceId, 'D-03');
  assert.equal(list('sort=id&direction=desc').items[0].deviceId, 'D-24');
  db.exec("DELETE FROM devices WHERE id > 'D-09'");
  assert.equal(list('pageSize=10&page=3').page, 1);
});

test('invalid and duplicate query parameters fail without changing the database', (t) => {
  const { add, list } = fixture(t);
  add('one');
  for (const query of ['health=healthy', 'source=gateway', 'connection=updating', 'attention=false', 'sort=id;DROP TABLE devices', 'direction=invalid', 'page=0', 'page=-1', 'page=1.5', 'page=9007199254740992', 'pageSize=1000', 'pageSize=', 'health=online&health=offline', 'extra=1', `q=${'a'.repeat(101)}`]) {
    assert.throws(() => list(query), (error) => error.statusCode === 400, query);
  }
  assert.equal(list().total, 1);
});
