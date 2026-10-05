import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, migrateDatabase } from '../src/database.js';
import { ingestGatewayHeartbeat } from '../src/gateway-ingestion.js';
import { createSimulatorJob, listSimulatorJobs, pollSimulatorCommands, acceptSimulatorResult, expireSimulatorJobs } from '../src/simulator-jobs.js';
import { getOverviewSummary } from '../src/overview-summary.js';

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'sdr-jobs-'));
  const db = openDatabase(join(dir, 'jobs.db'));
  migrateDatabase(db); migrateDatabase(db);
  t.after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });
  ingestGatewayHeartbeat(db, 'SIM-SDR-001', {});
  ingestGatewayHeartbeat(db, 'SIM-SDR-002', {});
  return db;
}
const spec = { jobId: 'test-job', deviceIds: ['SIM-SDR-001', 'SIM-SDR-002'], telemetry: { throughputMbps: 85, snrDb: 24 } };

test('simulated jobs correlate each target, aggregate lifecycle and preserve simulator source', (t) => {
  const db = fixture(t);
  assert.equal(createSimulatorJob(db, spec), 'test-job');
  assert.equal(createSimulatorJob(db, spec), 'test-job');
  assert.equal(listSimulatorJobs(db).length, 1);
  assert.equal(getOverviewSummary(db).metrics.activeJobs, 1);
  assert.equal(getOverviewSummary(db).source.mode, 'simulator');
  assert.equal(pollSimulatorCommands(db, 'SIM-SDR-001')[0].deviceId, 'SIM-SDR-001');
  assert.equal(pollSimulatorCommands(db, 'SIM-SDR-001').length, 1, 'Unacknowledged commands can be redelivered');
  assert.throws(() => acceptSimulatorResult(db, 'SIM-SDR-002', { jobId: 'test-job', status: 'succeeded' }), /dispatched/);
  const result = acceptSimulatorResult(db, 'SIM-SDR-001', { jobId: 'test-job', status: 'succeeded' });
  assert.equal(result.deviceId, 'SIM-SDR-001');
  assert.equal(listSimulatorJobs(db)[0].status, 'deploying');
  acceptSimulatorResult(db, 'SIM-SDR-001', { jobId: 'test-job', status: 'succeeded' });
  assert.throws(() => acceptSimulatorResult(db, 'SIM-SDR-001', { jobId: 'test-job', status: 'failed' }), /Conflicting/);
  pollSimulatorCommands(db, 'SIM-SDR-002');
  acceptSimulatorResult(db, 'SIM-SDR-002', { jobId: 'test-job', status: 'succeeded' });
  assert.equal(listSimulatorJobs(db)[0].status, 'succeeded');
  assert.equal(getOverviewSummary(db).metrics.activeJobs, 0);
  assert.deepEqual(pollSimulatorCommands(db, 'SIM-SDR-001'), []);
  assert.throws(() => createSimulatorJob(db, { ...spec, telemetry: { snrDb: 1 } }), /different/);
});

test('failed and timed-out simulated jobs are durable terminal outcomes', (t) => {
  const db = fixture(t);
  createSimulatorJob(db, { ...spec, jobId: 'failed', outcome: 'failure' });
  for (const id of spec.deviceIds) {
    pollSimulatorCommands(db, id);
    acceptSimulatorResult(db, id, { jobId: 'failed', status: 'failed' });
  }
  assert.equal(listSimulatorJobs(db)[0].status, 'failed');
  const old = new Date(Date.now() - 5000).toISOString();
  createSimulatorJob(db, { ...spec, jobId: 'timeout', outcome: 'timeout', timeoutMs: 1000 }, old);
  expireSimulatorJobs(db);
  const timed = listSimulatorJobs(db).find((job) => job.jobId === 'timeout');
  assert.equal(timed.status, 'failed');
  assert.ok(timed.targets.every((target) => target.status === 'timeout'));
  assert.throws(() => acceptSimulatorResult(db, 'SIM-SDR-001', { jobId: 'timeout', status: 'succeeded' }), /terminal/);
});

test('job validation rejects physical targets, malformed telemetry and duplicates without partial writes', (t) => {
  const db = fixture(t);
  ingestGatewayHeartbeat(db, 'ESP8266-001', {});
  for (const invalid of [
    { ...spec, deviceIds: ['ESP8266-001'] }, { ...spec, deviceIds: ['SIM-SDR-missing'] },
    { ...spec, deviceIds: ['SIM-SDR-001', 'SIM-SDR-001'] }, { ...spec, telemetry: { snrDb: 201 } },
    { ...spec, telemetry: { password: 'secret' } }, { ...spec, timeoutMs: 1 }, { ...spec, outcome: 'physical' },
  ]) assert.throws(() => createSimulatorJob(db, invalid));
  assert.equal(listSimulatorJobs(db).length, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM reconfiguration_jobs').get().n, 0);
});
