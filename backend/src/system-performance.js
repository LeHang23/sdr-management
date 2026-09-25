import { readSnapshot } from './database.js';

export const PERFORMANCE_RANGES = Object.freeze({
  '1h': { label: 'Last hour', durationMinutes: 60, bucketMinutes: 5 },
  '6h': { label: 'Last 6 hours', durationMinutes: 360, bucketMinutes: 30 },
  '24h': { label: 'Last 24 hours', durationMinutes: 1_440, bucketMinutes: 120 },
});

const bucketCount = 13;

function average(total, count) {
  return count === 0 ? null : Number((total / count).toFixed(1));
}

function sourceDetails(mode) {
  return {
    mode,
    label: mode === 'sdr_gateway' ? 'SDR Gateway' : 'Manual database input',
  };
}

export function getSystemPerformance(database, rangeKey) {
  const range = PERFORMANCE_RANGES[rangeKey];
  if (!range) throw new RangeError(`Unsupported performance range: ${rangeKey}`);

  return readSnapshot(database, () => {
    const revision = database.prepare("SELECT value, updated_at FROM overview_metadata WHERE key = 'revision'").get();
    const latest = database.prepare('SELECT MAX(sampled_at) AS sampled_at FROM device_telemetry').get();

    if (!latest.sampled_at) {
      return {
        snapshotId: `performance-${revision.value}-${rangeKey}`,
        generatedAt: revision.updated_at,
        source: sourceDetails('manual'),
        range: { key: rangeKey, ...range },
        summary: { averageOnlineDevices: 0, sampleCount: 0, partial: false },
        points: [],
      };
    }

    const toTime = Date.parse(latest.sampled_at);
    const fromTime = toTime - range.durationMinutes * 60_000;
    const bucketDuration = range.bucketMinutes * 60_000;
    const rows = database.prepare(`
      SELECT device_id, sampled_at, source, throughput_mbps, snr_db
      FROM device_telemetry
      WHERE sampled_at >= ? AND sampled_at <= ?
      ORDER BY sampled_at ASC, device_id ASC
    `).all(new Date(fromTime).toISOString(), new Date(toTime).toISOString());

    const buckets = Array.from({ length: bucketCount }, () => ({
      throughputTotal: 0,
      throughputCount: 0,
      snrTotal: 0,
      snrCount: 0,
      devices: new Set(),
    }));

    let hasGatewayData = false;
    for (const row of rows) {
      const sampledTime = Date.parse(row.sampled_at);
      const index = Math.min(
        bucketCount - 1,
        Math.max(0, Math.round((sampledTime - fromTime) / bucketDuration)),
      );
      const bucket = buckets[index];
      bucket.devices.add(row.device_id);
      if (row.source === 'sdr_gateway') hasGatewayData = true;
      if (Number.isFinite(row.throughput_mbps)) {
        bucket.throughputTotal += row.throughput_mbps;
        bucket.throughputCount += 1;
      }
      if (Number.isFinite(row.snr_db)) {
        bucket.snrTotal += row.snr_db;
        bucket.snrCount += 1;
      }
    }

    const points = buckets.map((bucket, index) => ({
      timestamp: new Date(fromTime + index * bucketDuration).toISOString(),
      throughputMbps: average(bucket.throughputTotal, bucket.throughputCount),
      snrDb: average(bucket.snrTotal, bucket.snrCount),
      onlineDevices: bucket.devices.size,
    }));
    const populatedPoints = points.filter((point) => point.onlineDevices > 0);
    const averageOnlineDevices = populatedPoints.length === 0
      ? 0
      : Number((
        populatedPoints.reduce((total, point) => total + point.onlineDevices, 0) / populatedPoints.length
      ).toFixed(1));

    return {
      snapshotId: `performance-${revision.value}-${rangeKey}`,
      generatedAt: latest.sampled_at,
      source: sourceDetails(hasGatewayData ? 'sdr_gateway' : 'manual'),
      range: { key: rangeKey, ...range },
      summary: {
        averageOnlineDevices,
        sampleCount: rows.length,
        partial: points.some((point) => point.throughputMbps === null || point.snrDb === null),
      },
      points,
    };
  });
}
