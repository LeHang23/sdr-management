import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { migrateDatabase, seedDatabase } from '../src/database.js';
import { getSystemPerformance } from '../src/system-performance.js';

function createDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  migrateDatabase(database);
  return database;
}

test('returns an explicit empty performance snapshot', () => {
  const database = createDatabase();
  try {
    const performance = getSystemPerformance(database, '6h');
    assert.equal(performance.range.key, '6h');
    assert.equal(performance.summary.sampleCount, 0);
    assert.equal(performance.summary.partial, false);
    assert.deepEqual(performance.points, []);
  } finally {
    database.close();
  }
});

test('aggregates stored telemetry into the requested range', () => {
  const database = createDatabase();
  try {
    database.exec(`
      INSERT INTO devices (id, display_name, connection_status, health_status) VALUES
        ('SDR-001', 'SDR-001', 'online', 'online'),
        ('SDR-002', 'SDR-002', 'online', 'online');
      INSERT INTO device_telemetry (device_id, sampled_at, source, throughput_mbps, snr_db) VALUES
        ('SDR-001', '2026-09-25T10:00:00.000Z', 'manual', 40, 18),
        ('SDR-002', '2026-09-25T10:00:00.000Z', 'manual', 60, 22),
        ('SDR-001', '2026-09-25T10:30:00.000Z', 'manual', 50, 20),
        ('SDR-002', '2026-09-25T10:30:00.000Z', 'sdr_gateway', 70, 24);
    `);

    const performance = getSystemPerformance(database, '6h');
    const latestPoint = performance.points.at(-1);
    assert.equal(performance.points.length, 13);
    assert.equal(latestPoint.throughputMbps, 60);
    assert.equal(latestPoint.snrDb, 22);
    assert.equal(latestPoint.onlineDevices, 2);
    assert.equal(performance.source.mode, 'sdr_gateway');
    assert.equal(performance.summary.sampleCount, 4);
    assert.equal(performance.summary.partial, true);
  } finally {
    database.close();
  }
});

test('preserves partial samples instead of converting missing metrics to zero', () => {
  const database = createDatabase();
  try {
    database.exec(`
      INSERT INTO devices (id, display_name, connection_status, health_status)
      VALUES ('SDR-001', 'SDR-001', 'online', 'online');
      INSERT INTO device_telemetry (device_id, sampled_at, throughput_mbps, snr_db) VALUES
        ('SDR-001', '2026-09-25T11:55:00.000Z', 55, NULL),
        ('SDR-001', '2026-09-25T12:00:00.000Z', 65, 21);
    `);

    const performance = getSystemPerformance(database, '1h');
    assert.equal(performance.points.at(-2).throughputMbps, 55);
    assert.equal(performance.points.at(-2).snrDb, null);
    assert.equal(performance.summary.partial, true);
  } finally {
    database.close();
  }
});

test('rejects unsupported ranges', () => {
  const database = createDatabase();
  try {
    assert.throws(() => getSystemPerformance(database, '7d'), RangeError);
  } finally {
    database.close();
  }
});

test('demo telemetry seed is recent and idempotent', () => {
  const database = createDatabase();
  try {
    seedDatabase(database);
    const firstCount = Number(database.prepare('SELECT COUNT(*) AS value FROM device_telemetry').get().value);
    const latest = database.prepare('SELECT MAX(sampled_at) AS value FROM device_telemetry').get().value;
    seedDatabase(database);
    const secondCount = Number(database.prepare('SELECT COUNT(*) AS value FROM device_telemetry').get().value);

    assert.equal(firstCount, 5_491);
    assert.equal(secondCount, firstCount);
    assert.ok(Date.now() - Date.parse(latest) < 6 * 60_000);
  } finally {
    database.close();
  }
});
