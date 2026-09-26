const DEVICE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const HEALTH_STATUSES = new Set(['online', 'warning', 'offline', 'updating']);

export class GatewayIngestionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GatewayIngestionError';
  }
}

function requireFiniteNumber(value, field, { minimum = -Infinity, maximum = Infinity } = {}) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new GatewayIngestionError(`${field} must be a finite number between ${minimum} and ${maximum}`);
  }
  return value;
}

function normalizeTimestamp(value, fallback) {
  const timestamp = value ?? fallback;
  if (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))) {
    throw new GatewayIngestionError('sampledAt must be a valid ISO-8601 timestamp');
  }
  return new Date(timestamp).toISOString();
}

function validateHeartbeat(deviceId, payload, receivedAt) {
  if (!DEVICE_ID_PATTERN.test(deviceId)) {
    throw new GatewayIngestionError('deviceId must contain 1-64 letters, numbers, dots, colons, underscores, or hyphens');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new GatewayIngestionError('request body must be a JSON object');
  }

  const displayName = payload.displayName ?? deviceId;
  if (typeof displayName !== 'string' || displayName.trim().length === 0 || displayName.length > 100) {
    throw new GatewayIngestionError('displayName must contain 1-100 characters');
  }

  const healthStatus = payload.healthStatus ?? 'online';
  if (!HEALTH_STATUSES.has(healthStatus)) {
    throw new GatewayIngestionError(`healthStatus must be one of: ${[...HEALTH_STATUSES].join(', ')}`);
  }

  let telemetry = null;
  if (payload.telemetry !== undefined) {
    if (!payload.telemetry || typeof payload.telemetry !== 'object' || Array.isArray(payload.telemetry)) {
      throw new GatewayIngestionError('telemetry must be a JSON object');
    }
    const throughputMbps = payload.telemetry.throughputMbps;
    const snrDb = payload.telemetry.snrDb;
    if (throughputMbps === undefined && snrDb === undefined) {
      throw new GatewayIngestionError('telemetry must include throughputMbps or snrDb');
    }
    telemetry = {
      sampledAt: normalizeTimestamp(payload.telemetry.sampledAt, receivedAt),
      throughputMbps: throughputMbps === undefined
        ? null
        : requireFiniteNumber(throughputMbps, 'throughputMbps', { minimum: 0, maximum: 100_000 }),
      snrDb: snrDb === undefined
        ? null
        : requireFiniteNumber(snrDb, 'snrDb', { minimum: -200, maximum: 200 }),
    };
  }

  return { displayName: displayName.trim(), healthStatus, telemetry };
}

export function ingestGatewayHeartbeat(database, deviceId, payload, receivedAt = new Date().toISOString()) {
  const normalizedReceivedAt = normalizeTimestamp(receivedAt, receivedAt);
  const heartbeat = validateHeartbeat(deviceId, payload, normalizedReceivedAt);

  database.exec('BEGIN IMMEDIATE;');
  try {
    database.prepare(`
      INSERT INTO devices (
        id, display_name, source, connection_status, health_status, last_seen_at, updated_at
      ) VALUES (?, ?, 'sdr_gateway', 'online', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        source = 'sdr_gateway',
        connection_status = 'online',
        health_status = excluded.health_status,
        last_seen_at = excluded.last_seen_at,
        updated_at = excluded.updated_at
    `).run(deviceId, heartbeat.displayName, heartbeat.healthStatus, normalizedReceivedAt, normalizedReceivedAt);

    if (heartbeat.telemetry) {
      database.prepare(`
        INSERT INTO device_telemetry (
          device_id, sampled_at, source, throughput_mbps, snr_db
        ) VALUES (?, ?, 'sdr_gateway', ?, ?)
        ON CONFLICT(device_id, sampled_at) DO UPDATE SET
          source = 'sdr_gateway',
          throughput_mbps = excluded.throughput_mbps,
          snr_db = excluded.snr_db
      `).run(
        deviceId,
        heartbeat.telemetry.sampledAt,
        heartbeat.telemetry.throughputMbps,
        heartbeat.telemetry.snrDb,
      );
    }

    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }

  return {
    deviceId,
    acceptedAt: normalizedReceivedAt,
    connectionStatus: 'online',
    healthStatus: heartbeat.healthStatus,
    telemetryAccepted: heartbeat.telemetry !== null,
  };
}

export function expireStaleGatewayDevices(database, staleBefore) {
  const normalizedStaleBefore = normalizeTimestamp(staleBefore, staleBefore);
  const result = database.prepare(`
    UPDATE devices
    SET connection_status = 'offline',
        health_status = 'offline',
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE source = 'sdr_gateway'
      AND connection_status = 'online'
      AND (last_seen_at IS NULL OR last_seen_at < ?)
  `).run(normalizedStaleBefore);
  return Number(result.changes);
}
