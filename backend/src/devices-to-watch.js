export const DEVICES_TO_WATCH_LIMIT = 5;

// Called inside the Overview read transaction so the list and KPI stay coherent.
export function getDevicesToWatch(database, total) {
  const rows = database.prepare(`
    WITH ranked_issues AS (
      SELECT *, ROW_NUMBER() OVER (
        PARTITION BY device_id
        ORDER BY CASE severity WHEN 'critical' THEN 3 WHEN 'warning' THEN 2 ELSE 1 END DESC,
          julianday(updated_at) DESC, id ASC
      ) AS rank
      FROM device_issues WHERE status = 'active'
    )
    SELECT device.id, device.display_name, device.health_status, device.last_seen_at,
      issue.summary, issue.severity,
      COALESCE(issue.updated_at, device.updated_at) AS attention_at
    FROM devices AS device
    LEFT JOIN ranked_issues AS issue ON issue.device_id = device.id AND issue.rank = 1
    WHERE device.health_status IN ('warning', 'offline') OR issue.severity = 'critical'
    ORDER BY CASE
      WHEN issue.severity = 'critical' THEN 3
      WHEN device.health_status = 'offline' THEN 2
      ELSE 1 END DESC,
      julianday(COALESCE(issue.updated_at, device.updated_at)) DESC, device.id ASC
    LIMIT ?
  `).all(DEVICES_TO_WATCH_LIMIT);

  return {
    total,
    limit: DEVICES_TO_WATCH_LIMIT,
    items: rows.map((row) => ({
      deviceId: row.id,
      displayName: row.display_name,
      healthStatus: row.health_status,
      issueSummary: row.summary ?? (row.health_status === 'offline'
        ? 'Device is offline' : 'Device health requires attention'),
      issueSeverity: row.severity ?? null,
      lastSeenAt: row.last_seen_at,
      attentionAt: row.attention_at,
    })),
  };
}
