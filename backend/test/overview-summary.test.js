import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { migrateDatabase } from '../src/database.js';
import { getOverviewSummary } from '../src/overview-summary.js';

function createDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  migrateDatabase(database);
  return database;
}

test('returns valid zero values for an empty fleet', () => {
  const database = createDatabase();
  try {
    const summary = getOverviewSummary(database);
    assert.deepEqual(summary.metrics, {
      totalDevices: 0,
      onlineNow: 0,
      needsAttention: 0,
      activeJobs: 0,
    });
    assert.equal(summary.details.availabilityPercent, null);
  } finally {
    database.close();
  }
});

test('derives summary metrics from one database snapshot without double-counting issues', () => {
  const database = createDatabase();
  try {
    database.exec(`
      INSERT INTO devices (id, display_name, connection_status, health_status) VALUES
        ('SDR-001', 'SDR-001', 'online', 'online'),
        ('SDR-002', 'SDR-002', 'online', 'warning'),
        ('SDR-003', 'SDR-003', 'offline', 'offline'),
        ('SDR-004', 'SDR-004', 'offline', 'updating');
      INSERT INTO device_issues (id, device_id, severity, status, summary) VALUES
        ('ISS-001', 'SDR-002', 'critical', 'active', 'Critical SNR'),
        ('ISS-002', 'SDR-002', 'critical', 'active', 'Critical temperature');
      INSERT INTO reconfiguration_jobs (id, status) VALUES
        ('RC-001', 'deploying'),
        ('RC-002', 'verifying'),
        ('RC-003', 'succeeded');
    `);

    const summary = getOverviewSummary(database);
    assert.deepEqual(summary.metrics, {
      totalDevices: 4,
      onlineNow: 2,
      needsAttention: 2,
      activeJobs: 2,
    });
    assert.deepEqual(summary.details.healthCounts, {
      online: 1,
      warning: 1,
      offline: 1,
      updating: 1,
    });
    assert.equal(summary.details.availabilityPercent, 50);
  } finally {
    database.close();
  }
});
