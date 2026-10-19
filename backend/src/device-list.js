import { readSnapshot } from './database.js';

const healthStates = ['online', 'warning', 'offline', 'updating'];
const sourceSql = "CASE WHEN d.source = 'manual' THEN 'manual' WHEN d.id LIKE 'SIM-SDR-%' THEN 'simulator' ELSE 'sdr_gateway' END";
const attentionSql = `(d.health_status IN ('warning', 'offline') OR EXISTS (
  SELECT 1 FROM device_issues i WHERE i.device_id = d.id AND i.status = 'active' AND i.severity = 'critical'))`;
const sortSql = {
  id: 'd.id COLLATE NOCASE', name: 'd.display_name COLLATE NOCASE',
  health: "CASE d.health_status WHEN 'offline' THEN 0 WHEN 'warning' THEN 1 WHEN 'updating' THEN 2 ELSE 3 END",
  connection: 'd.connection_status', lastSeen: 'julianday(d.last_seen_at)',
};

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

export function parseDeviceListQuery(params = new URLSearchParams()) {
  const keys = ['q', 'health', 'connection', 'source', 'attention', 'sort', 'direction', 'page', 'pageSize'];
  for (const key of params.keys()) {
    if (!keys.includes(key) || params.getAll(key).length !== 1) invalid(`Invalid query parameter: ${key}`);
  }
  const query = Object.fromEntries(keys.map((key) => [key, params.get(key)]));
  query.q = (query.q ?? '').trim();
  if (query.q.length > 100) invalid('Search must be at most 100 characters');
  for (const [key, options, fallback] of [
    ['health', ['all', ...healthStates], 'all'],
    ['connection', ['all', 'online', 'offline'], 'all'],
    ['source', ['all', 'manual', 'simulator', 'sdr_gateway'], 'all'],
    ['attention', ['all', 'true'], 'all'],
    ['sort', Object.keys(sortSql), 'name'],
    ['direction', ['asc', 'desc'], 'asc'],
  ]) {
    query[key] ??= fallback;
    if (!options.includes(query[key])) invalid(`Unsupported ${key}`);
  }
  for (const [key, fallback] of [['page', '1'], ['pageSize', '25']]) {
    query[key] ??= fallback;
    if (!/^[1-9]\d*$/.test(query[key]) || !Number.isSafeInteger(Number(query[key]))) invalid(`Invalid ${key}`);
    query[key] = Number(query[key]);
  }
  if (![10, 25, 50, 100].includes(query.pageSize)) invalid('pageSize must be 10, 25, 50 or 100');
  return query;
}

export function getDeviceList(database, params) {
  const query = parseDeviceListQuery(params);
  const conditions = [];
  const bindings = [];
  if (query.q) {
    // instr treats %, _ and quotes literally; values never become SQL syntax.
    conditions.push('(instr(lower(d.id), lower(?)) > 0 OR instr(lower(d.display_name), lower(?)) > 0)');
    bindings.push(query.q, query.q);
  }
  if (query.health !== 'all') { conditions.push('d.health_status = ?'); bindings.push(query.health); }
  if (query.connection !== 'all') { conditions.push('d.connection_status = ?'); bindings.push(query.connection); }
  if (query.source !== 'all') { conditions.push(`${sourceSql} = ?`); bindings.push(query.source); }
  if (query.attention === 'true') conditions.push(attentionSql);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return readSnapshot(database, () => {
    const fleetTotal = Number(database.prepare('SELECT COUNT(*) AS total FROM devices').get().total);
    const total = Number(database.prepare(`SELECT COUNT(*) AS total FROM devices d ${where}`).get(...bindings).total);
    const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, pageCount);
    const rows = database.prepare(`SELECT d.*, ${sourceSql} AS source_mode,
      ${attentionSql} AS needs_attention FROM devices d ${where}
      ORDER BY ${query.sort === 'lastSeen' ? '(d.last_seen_at IS NULL) ASC,' : ''}
        ${sortSql[query.sort]} ${query.direction.toUpperCase()}, d.id ASC
      LIMIT ? OFFSET ?`).all(...bindings, query.pageSize, (page - 1) * query.pageSize);
    const revision = database.prepare("SELECT value FROM overview_metadata WHERE key = 'revision'").get().value;
    return {
      snapshotId: `devices-${revision}`, generatedAt: new Date().toISOString(),
      fleetTotal, total, page, pageSize: query.pageSize, pageCount,
      query: { ...query, page },
      items: rows.map((row) => ({
        deviceId: row.id, displayName: row.display_name, source: row.source_mode,
        healthStatus: row.health_status, connectionStatus: row.connection_status,
        lastSeenAt: row.last_seen_at, needsAttention: Boolean(row.needs_attention),
      })),
    };
  });
}
