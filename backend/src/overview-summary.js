import { readSnapshot } from './database.js';

export const ACTIVE_JOB_STATUSES = ['queued', 'deploying', 'verifying', 'retrying'];

function number(row) {
  return Number(row.value ?? 0);
}

function countByStatus(rows, statuses) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0]));
  for (const row of rows) {
    counts[row.status] = Number(row.count);
  }
  return counts;
}

export function getOverviewSummary(database) {
  return readSnapshot(database, () => {
    const totalDevices = number(database.prepare('SELECT COUNT(*) AS value FROM devices').get());
    const onlineNow = number(database.prepare("SELECT COUNT(*) AS value FROM devices WHERE connection_status = 'online'").get());
    const needsAttention = number(database.prepare(`
      SELECT COUNT(*) AS value
      FROM devices AS device
      WHERE device.health_status IN ('warning', 'offline')
        OR EXISTS (
          SELECT 1
          FROM device_issues AS issue
          WHERE issue.device_id = device.id
            AND issue.status = 'active'
            AND issue.severity = 'critical'
        )
    `).get());
    const activeJobs = number(database.prepare(`
      SELECT COUNT(*) AS value
      FROM reconfiguration_jobs
      WHERE status IN ('queued', 'deploying', 'verifying', 'retrying')
    `).get());
    const addedThisMonth = number(database.prepare(`
      SELECT COUNT(*) AS value
      FROM devices
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get());
    const healthCounts = countByStatus(
      database.prepare('SELECT health_status AS status, COUNT(*) AS count FROM devices GROUP BY health_status').all(),
      ['online', 'warning', 'offline', 'updating'],
    );
    const activeJobCounts = countByStatus(
      database.prepare(`
        SELECT status, COUNT(*) AS count
        FROM reconfiguration_jobs
        WHERE status IN ('queued', 'deploying', 'verifying', 'retrying')
        GROUP BY status
      `).all(),
      ACTIVE_JOB_STATUSES,
    );
    const revision = database.prepare("SELECT value, updated_at FROM overview_metadata WHERE key = 'revision'").get();
    const source = database.prepare(`
      SELECT CASE
        WHEN EXISTS (SELECT 1 FROM devices WHERE source = 'sdr_gateway')
          OR EXISTS (SELECT 1 FROM reconfiguration_jobs WHERE source = 'sdr_gateway')
        THEN 'sdr_gateway'
        ELSE 'manual'
      END AS mode
    `).get().mode;

    return {
      snapshotId: `overview-${revision.value}`,
      generatedAt: revision.updated_at,
      source: {
        mode: source,
        label: source === 'sdr_gateway' ? 'SDR Gateway' : 'Manual database input',
      },
      metrics: { totalDevices, onlineNow, needsAttention, activeJobs },
      details: {
        addedThisMonth,
        healthCounts,
        activeJobCounts,
        availabilityPercent: totalDevices === 0 ? null : Number(((onlineNow / totalDevices) * 100).toFixed(1)),
      },
    };
  });
}
