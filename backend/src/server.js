import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, migrateDatabase, seedDatabase } from './database.js';
import { getOverviewSummary } from './overview-summary.js';
import { getSystemPerformance, PERFORMANCE_RANGES } from './system-performance.js';
import {
  GatewayIngestionError,
  expireStaleGatewayDevices,
  ingestGatewayHeartbeat,
} from './gateway-ingestion.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(currentDirectory, '../..');
const frontendDirectory = resolve(rootDirectory, 'frontend');
const databasePath = process.env.SDR_DATABASE_PATH ?? resolve(rootDirectory, 'backend/data/sdr-management.db');
const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 4173);
const gatewayToken = process.env.SDR_GATEWAY_TOKEN;
const heartbeatTimeoutMs = Number(process.env.SDR_HEARTBEAT_TIMEOUT_MS ?? 180_000);
const database = openDatabase(databasePath);
migrateDatabase(database);
if (process.env.SDR_SEED_DEMO === 'true') {
  const deviceCount = Number(database.prepare('SELECT COUNT(*) AS value FROM devices').get().value);
  if (deviceCount === 0) seedDatabase(database);
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(response, statusCode, value, headers = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end(JSON.stringify(value));
}

function tokensMatch(provided, expected) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

function authorizeGateway(request, response) {
  if (!gatewayToken) {
    sendJson(response, 503, { error: 'SDR Gateway ingestion is disabled' });
    return false;
  }
  const authorization = request.headers.authorization ?? '';
  const providedToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!providedToken || !tokensMatch(providedToken, gatewayToken)) {
    sendJson(response, 401, { error: 'Invalid gateway credentials' }, { 'WWW-Authenticate': 'Bearer' });
    return false;
  }
  return true;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) {
      const error = new Error('Request body exceeds 64 KiB');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request body must contain valid JSON');
    error.statusCode = 400;
    throw error;
  }
}

async function serveStatic(pathname, response) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = resolve(frontendDirectory, relativePath);
  if (!filePath.startsWith(`${frontendDirectory}${sep}`) && filePath !== frontendDirectory) {
    sendJson(response, 403, { error: 'Forbidden' });
    return;
  }
  if (!existsSync(filePath)) {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }
  const content = await readFile(filePath);
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': extname(filePath) === '.html' ? 'no-store' : 'public, max-age=300',
  });
  response.end(content);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host ?? `${host}:${port}`}`);
  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }
  const heartbeatMatch = url.pathname.match(/^\/api\/v1\/gateway\/devices\/([^/]+)\/heartbeat$/);
  if (request.method === 'POST' && heartbeatMatch) {
    if (!authorizeGateway(request, response)) return;
    try {
      const deviceId = decodeURIComponent(heartbeatMatch[1]);
      const payload = await readJson(request);
      const accepted = ingestGatewayHeartbeat(database, deviceId, payload);
      sendJson(response, 202, accepted);
    } catch (error) {
      if (error instanceof GatewayIngestionError || error.statusCode) {
        sendJson(response, error.statusCode ?? 400, { error: error.message });
        return;
      }
      console.error('Could not ingest gateway heartbeat', error);
      sendJson(response, 500, { error: 'Gateway heartbeat unavailable' });
    }
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/v1/overview/summary') {
    try {
      const summary = getOverviewSummary(database);
      const etag = `\"${summary.snapshotId}\"`;
      if (request.headers['if-none-match'] === etag) {
        response.writeHead(304, { ETag: etag, 'Cache-Control': 'no-store' });
        response.end();
        return;
      }
      sendJson(response, 200, summary, { ETag: etag });
    } catch (error) {
      console.error('Could not build overview summary', error);
      sendJson(response, 500, { error: 'Overview summary unavailable' });
    }
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/v1/overview/performance') {
    const rangeKey = url.searchParams.get('range') ?? '6h';
    if (!PERFORMANCE_RANGES[rangeKey]) {
      sendJson(response, 400, {
        error: 'Unsupported performance range',
        supportedRanges: Object.keys(PERFORMANCE_RANGES),
      });
      return;
    }
    try {
      const performance = getSystemPerformance(database, rangeKey);
      const etag = `\"${performance.snapshotId}\"`;
      if (request.headers['if-none-match'] === etag) {
        response.writeHead(304, { ETag: etag, 'Cache-Control': 'no-store' });
        response.end();
        return;
      }
      sendJson(response, 200, performance, { ETag: etag });
    } catch (error) {
      console.error('Could not build system performance snapshot', error);
      sendJson(response, 500, { error: 'System performance unavailable' });
    }
    return;
  }
  if (request.method === 'GET') {
    try {
      await serveStatic(decodeURIComponent(url.pathname), response);
    } catch (error) {
      console.error('Could not serve static file', error);
      sendJson(response, 500, { error: 'Application unavailable' });
    }
    return;
  }
  sendJson(response, 405, { error: 'Method not allowed' }, { Allow: 'GET' });
});

server.listen(port, host, () => {
  console.log(`SDR Management running at http://${host}:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});

const expirationTimer = gatewayToken && Number.isFinite(heartbeatTimeoutMs) && heartbeatTimeoutMs > 0
  ? setInterval(() => {
      try {
        expireStaleGatewayDevices(database, new Date(Date.now() - heartbeatTimeoutMs).toISOString());
      } catch (error) {
        console.error('Could not expire stale gateway devices', error);
      }
    }, Math.max(1_000, Math.min(heartbeatTimeoutMs, 5_000)))
  : null;
expirationTimer?.unref();

function closeServer() {
  if (expirationTimer) clearInterval(expirationTimer);
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.once('SIGINT', closeServer);
process.once('SIGTERM', closeServer);
