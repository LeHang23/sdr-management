import { GatewayIngestionError } from './gateway-ingestion.js';

export function getGatewayDeviceStatus(database, deviceId) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(deviceId)) throw new GatewayIngestionError('Invalid device ID');
  const row = database.prepare(`SELECT id, source, connection_status, health_status, last_seen_at, updated_at
    FROM devices WHERE id = ?`).get(deviceId);
  if (!row) return null;
  return {
    deviceId: row.id,
    source: { mode: row.source === 'manual' ? 'manual' : row.id.startsWith('SIM-SDR-') ? 'simulator' : 'sdr_gateway' },
    connectionStatus: row.connection_status, healthStatus: row.health_status,
    lastSeenAt: row.last_seen_at, updatedAt: row.updated_at, checkedAt: new Date().toISOString(),
  };
}
