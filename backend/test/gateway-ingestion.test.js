import assert from 'node:assert/strict';
import test from 'node:test';
import { openDatabase, migrateDatabase } from '../src/database.js';
import {
  GatewayIngestionError,
  expireStaleGatewayDevices,
  ingestGatewayHeartbeat,
} from '../src/gateway-ingestion.js';
import { getOverviewSummary } from '../src/overview-summary.js';

function createDatabase() {
  const database = openDatabase(':memory:');
  migrateDatabase(database);
  return database;
}

test('accepts a gateway heartbeat and telemetry in one durable update', () => {
  const database = createDatabase();
  try {
    const result = ingestGatewayHeartbeat(database, 'SIM-SDR-001', {
      displayName: 'Simulated SDR 1',
      healthStatus: 'warning',
      telemetry: { sampledAt: '2026-09-26T10:00:00.000Z', throughputMbps: 42.5, snrDb: 11.2 },
    }, '2026-09-26T10:00:01.000Z');

    assert.deepEqual(result, {
      deviceId: 'SIM-SDR-001',
      acceptedAt: '2026-09-26T10:00:01.000Z',
      connectionStatus: 'online',
      healthStatus: 'warning',
      telemetryAccepted: true,
    });
    assert.deepEqual({ ...database.prepare(`
      SELECT id, source, connection_status, health_status, last_seen_at
      FROM devices WHERE id = 'SIM-SDR-001'
    `).get() }, {
      id: 'SIM-SDR-001',
      source: 'sdr_gateway',
      connection_status: 'online',
      health_status: 'warning',
      last_seen_at: '2026-09-26T10:00:01.000Z',
    });
    assert.equal(database.prepare('SELECT COUNT(*) AS value FROM device_telemetry').get().value, 1);
    assert.deepEqual(getOverviewSummary(database).source, {
      mode: 'simulator',
      label: 'Remote device simulator',
    });
  } finally {
    database.close();
  }
});

test('rejects malformed gateway telemetry without creating a device', () => {
  const database = createDatabase();
  try {
    assert.throws(
      () => ingestGatewayHeartbeat(database, 'SIM-SDR-001', {
        healthStatus: 'unknown',
        telemetry: { throughputMbps: -1 },
      }),
      GatewayIngestionError,
    );
    assert.equal(database.prepare('SELECT COUNT(*) AS value FROM devices').get().value, 0);
  } finally {
    database.close();
  }
});

test('expires a gateway device after its heartbeat becomes stale', () => {
  const database = createDatabase();
  try {
    ingestGatewayHeartbeat(database, 'SIM-SDR-001', { healthStatus: 'online' }, '2026-09-26T10:00:00.000Z');
    assert.equal(expireStaleGatewayDevices(database, '2026-09-26T10:00:15.000Z'), 1);
    assert.deepEqual({ ...database.prepare(`
      SELECT connection_status, health_status FROM devices WHERE id = 'SIM-SDR-001'
    `).get() }, { connection_status: 'offline', health_status: 'offline' });
  } finally {
    database.close();
  }
});
