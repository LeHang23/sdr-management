import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, migrateDatabase } from './database.js';
import { getOverviewSummary } from './overview-summary.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(currentDirectory, '../..');
const frontendDirectory = resolve(rootDirectory, 'frontend');
const databasePath = process.env.SDR_DATABASE_PATH ?? resolve(rootDirectory, 'backend/data/sdr-management.db');
const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 4173);
const database = openDatabase(databasePath);
migrateDatabase(database);

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

function closeServer() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.once('SIGINT', closeServer);
process.once('SIGTERM', closeServer);
