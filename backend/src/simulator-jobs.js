import { randomUUID } from 'node:crypto';

export class SimulatorJobError extends Error {
  constructor(message, statusCode = 400) { super(message); this.statusCode = statusCode; }
}

export function migrateSimulatorJobs(database) {
  database.exec(`CREATE TABLE IF NOT EXISTS simulator_commands (
    job_id TEXT NOT NULL REFERENCES reconfiguration_jobs(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    configuration_json TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK(outcome IN ('success', 'failure', 'timeout')),
    status TEXT NOT NULL CHECK(status IN ('queued', 'deploying', 'succeeded', 'failed', 'timeout')),
    deadline_at TEXT NOT NULL,
    result_json TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(job_id, device_id)
  );`);
}

function transaction(database, action) {
  database.exec('BEGIN IMMEDIATE');
  try { const value = action(); database.exec('COMMIT'); return value; }
  catch (error) { database.exec('ROLLBACK'); throw error; }
}

function updateJob(database, jobId, now) {
  const rows = database.prepare('SELECT status FROM simulator_commands WHERE job_id = ?').all(jobId);
  const status = rows.some((row) => ['queued', 'deploying'].includes(row.status)) ? 'deploying'
    : rows.every((row) => row.status === 'succeeded') ? 'succeeded' : 'failed';
  database.prepare('UPDATE reconfiguration_jobs SET status = ?, updated_at = ? WHERE id = ?').run(status, now, jobId);
}

export function expireSimulatorJobs(database, now = new Date().toISOString()) {
  const expired = database.prepare("SELECT DISTINCT job_id FROM simulator_commands WHERE status IN ('queued','deploying') AND deadline_at <= ?").all(now);
  if (!expired.length) return;
  transaction(database, () => {
    database.prepare("UPDATE simulator_commands SET status = 'timeout', updated_at = ? WHERE status IN ('queued','deploying') AND deadline_at <= ?").run(now, now);
    for (const { job_id } of expired) updateJob(database, job_id, now);
  });
}

export function createSimulatorJob(database, input, now = new Date().toISOString()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new SimulatorJobError('Job must be an object');
  const jobId = input.jobId ?? randomUUID();
  if (typeof jobId !== 'string' || !/^[A-Za-z0-9._:-]{1,64}$/.test(jobId)) throw new SimulatorJobError('Invalid job ID');
  const ids = input.deviceIds;
  if (!Array.isArray(ids) || !ids.length || ids.length > 100 || new Set(ids).size !== ids.length) throw new SimulatorJobError('Select 1–100 unique simulator devices');
  for (const id of ids) {
    const row = database.prepare("SELECT id FROM devices WHERE id = ? AND source = 'sdr_gateway'").get(id);
    if (typeof id !== 'string' || !/^SIM-SDR-[A-Za-z0-9._:-]{1,56}$/.test(id) || !row) throw new SimulatorJobError('Only registered SIM-SDR- gateway devices can receive simulated commands');
  }
  const telemetry = input.telemetry;
  if (!telemetry || typeof telemetry !== 'object' || Array.isArray(telemetry) || !Object.keys(telemetry).length
    || Object.keys(telemetry).some((key) => !['throughputMbps', 'snrDb'].includes(key))) throw new SimulatorJobError('Configuration must contain throughputMbps and/or snrDb');
  for (const [key, value] of Object.entries(telemetry)) {
    const [min, max] = key === 'throughputMbps' ? [0, 100000] : [-200, 200];
    if (!Number.isFinite(value) || value < min || value > max) throw new SimulatorJobError(`Invalid ${key}`);
  }
  const outcome = input.outcome ?? 'success';
  const timeoutMs = input.timeoutMs ?? 30000;
  if (!['success', 'failure', 'timeout'].includes(outcome)) throw new SimulatorJobError('Invalid simulated outcome');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) throw new SimulatorJobError('timeoutMs must be 1000–300000');
  const configuration = JSON.stringify(Object.fromEntries(Object.entries(telemetry).sort()));
  const existing = database.prepare('SELECT * FROM simulator_commands WHERE job_id = ? ORDER BY device_id').all(jobId);
  if (existing.length) {
    if (JSON.stringify(existing.map((row) => row.device_id)) !== JSON.stringify([...ids].sort())
      || existing.some((row) => row.configuration_json !== configuration || row.outcome !== outcome)) throw new SimulatorJobError('Job ID already has different targets or configuration', 409);
    return jobId;
  }
  if (database.prepare('SELECT id FROM reconfiguration_jobs WHERE id = ?').get(jobId)) throw new SimulatorJobError('Job ID already exists', 409);
  transaction(database, () => {
    database.prepare("INSERT INTO reconfiguration_jobs(id, source, status, created_at, updated_at) VALUES (?, 'sdr_gateway', 'queued', ?, ?)").run(jobId, now, now);
    const insert = database.prepare("INSERT INTO simulator_commands VALUES (?, ?, ?, ?, 'queued', ?, NULL, ?)");
    for (const id of ids) insert.run(jobId, id, configuration, outcome, new Date(Date.parse(now) + timeoutMs).toISOString(), now);
  });
  return jobId;
}

function command(row) {
  return { jobId: row.job_id, deviceId: row.device_id, telemetry: JSON.parse(row.configuration_json),
    outcome: row.outcome, status: row.status, deadlineAt: row.deadline_at, updatedAt: row.updated_at,
    result: row.result_json ? JSON.parse(row.result_json) : null, source: 'simulator' };
}

export function listSimulatorJobs(database) {
  expireSimulatorJobs(database);
  return database.prepare(`SELECT j.id, j.status, j.created_at, j.updated_at FROM reconfiguration_jobs j
    WHERE EXISTS (SELECT 1 FROM simulator_commands c WHERE c.job_id = j.id)
    ORDER BY j.created_at DESC, j.id DESC LIMIT 50`).all().map((row) => ({
    jobId: row.id, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, source: 'simulator',
    targets: database.prepare('SELECT * FROM simulator_commands WHERE job_id = ? ORDER BY device_id').all(row.id).map(command),
  }));
}

export function pollSimulatorCommands(database, deviceId) {
  expireSimulatorJobs(database);
  const now = new Date().toISOString();
  return transaction(database, () => {
    const rows = database.prepare("SELECT * FROM simulator_commands WHERE device_id = ? AND status IN ('queued','deploying') ORDER BY updated_at, job_id LIMIT 10").all(deviceId);
    for (const row of rows) {
      database.prepare("UPDATE simulator_commands SET status = 'deploying', updated_at = ? WHERE job_id = ? AND device_id = ?").run(now, row.job_id, deviceId);
      row.status = 'deploying'; row.updated_at = now;
      updateJob(database, row.job_id, now);
    }
    return rows.map(command);
  });
}

export function acceptSimulatorResult(database, deviceId, input) {
  expireSimulatorJobs(database);
  if (!input || typeof input.jobId !== 'string' || !['succeeded', 'failed'].includes(input.status)) throw new SimulatorJobError('Result requires jobId and succeeded/failed status');
  const row = database.prepare('SELECT * FROM simulator_commands WHERE job_id = ? AND device_id = ?').get(input.jobId, deviceId);
  if (!row) throw new SimulatorJobError('Command not found for this job/device', 404);
  if (row.result_json) {
    const existing = JSON.parse(row.result_json);
    if (existing.status !== input.status) throw new SimulatorJobError('Conflicting duplicate result', 409);
    return command(row);
  }
  if (row.status !== 'deploying') throw new SimulatorJobError('Command is terminal or has not been dispatched', 409);
  if (row.outcome === 'timeout' || (row.outcome === 'success') !== (input.status === 'succeeded')) throw new SimulatorJobError('Result does not match the simulated outcome', 409);
  const now = new Date().toISOString();
  const result = { jobId: input.jobId, deviceId, status: input.status, receivedAt: now, source: 'simulator' };
  transaction(database, () => {
    database.prepare('UPDATE simulator_commands SET status = ?, result_json = ?, updated_at = ? WHERE job_id = ? AND device_id = ?').run(input.status, JSON.stringify(result), now, input.jobId, deviceId);
    updateJob(database, input.jobId, now);
  });
  return result;
}
