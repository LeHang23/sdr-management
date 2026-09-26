import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const simulatorDirectory = dirname(fileURLToPath(import.meta.url));
const consolePath = resolve(simulatorDirectory, 'console.html');
const serverUrl = (process.env.SDR_SERVER_URL ?? 'http://127.0.0.1:4173').replace(/\/$/, '');
const gatewayToken = process.env.SDR_GATEWAY_TOKEN;
const intervalMs = Number(process.env.SDR_SIMULATOR_INTERVAL_MS ?? 60_000);
const deviceCount = Math.min(100, Math.max(1, Number(process.env.SDR_SIMULATOR_DEVICE_COUNT ?? 4)));
const controlHost = process.env.SDR_SIMULATOR_CONTROL_HOST ?? '127.0.0.1';
const controlPort = Number(process.env.SDR_SIMULATOR_CONTROL_PORT ?? 4_180);
const runOnce = process.argv.includes('--once');
const allowedModes = new Set(['auto', 'online', 'warning', 'updating', 'disconnected']);

if (!gatewayToken) {
  console.error('SDR_GATEWAY_TOKEN is required. Use the same token configured on the backend.');
  process.exit(1);
}
if (!Number.isFinite(intervalMs) || intervalMs < 250) {
  console.error('SDR_SIMULATOR_INTERVAL_MS must be at least 250 milliseconds.');
  process.exit(1);
}
if (!Number.isInteger(controlPort) || controlPort < 1 || controlPort > 65_535) {
  console.error('SDR_SIMULATOR_CONTROL_PORT must be a valid TCP port.');
  process.exit(1);
}

let stopping = false;
let running = true;
let tick = 0;
let lastTickAt = null;
const startedAt = new Date().toISOString();
const totals = { accepted: 0, skipped: 0, failed: 0 };

function deviceId(index) {
  return `SIM-SDR-${String(index + 1).padStart(3, '0')}`;
}

const devices = Array.from({ length: deviceCount }, (_, index) => ({
  id: deviceId(index),
  displayName: deviceId(index),
  mode: 'auto',
  transportStatus: 'waiting',
  intendedHealthStatus: null,
  missedHeartbeats: 0,
  lastAttemptAt: null,
  lastAcceptedAt: null,
  lastHttpStatus: null,
  lastPayload: null,
  lastResponse: null,
  lastError: null,
}));

function automaticDeviceState(index, currentTick) {
  const phase = currentTick + index * 2;
  if (index % 4 === 1) {
    return { healthStatus: 'warning', throughputMbps: 34 + Math.sin(phase / 3) * 4, snrDb: 10.5 + Math.sin(phase / 4) };
  }
  if (index % 4 === 2 && currentTick % 10 < 3) {
    return { healthStatus: 'updating', throughputMbps: 18 + Math.sin(phase / 2) * 2, snrDb: 17.5 };
  }
  return {
    healthStatus: 'online',
    throughputMbps: 52 + index * 1.4 + Math.sin(phase / 3) * 6,
    snrDb: 20 + index * 0.3 + Math.cos(phase / 4) * 2,
  };
}

function forcedDeviceState(index, currentTick, mode) {
  const automatic = automaticDeviceState(index, currentTick);
  if (mode === 'auto') return automatic;
  if (mode === 'warning') return { ...automatic, healthStatus: 'warning', throughputMbps: Math.min(automatic.throughputMbps, 28), snrDb: 9.5 };
  if (mode === 'updating') return { ...automatic, healthStatus: 'updating', throughputMbps: Math.min(automatic.throughputMbps, 18), snrDb: 17.5 };
  return { ...automatic, healthStatus: 'online' };
}

function shouldSkipHeartbeat(index, currentTick) {
  const mode = devices[index].mode;
  if (mode === 'disconnected') return true;
  return mode === 'auto' && index % 4 === 3 && currentTick % 12 >= 4 && currentTick % 12 <= 8;
}

async function sendHeartbeat(index, sampledAt) {
  const device = devices[index];
  if (shouldSkipHeartbeat(index, tick)) {
    device.transportStatus = 'skipped';
    device.missedHeartbeats += 1;
    device.lastError = device.mode === 'disconnected'
      ? 'Disconnected by Simulator Console'
      : 'Automatic disconnect scenario';
    return { deviceId: device.id, skipped: true };
  }

  const state = forcedDeviceState(index, tick, device.mode);
  const payload = {
    displayName: device.displayName,
    healthStatus: state.healthStatus,
    telemetry: {
      sampledAt,
      throughputMbps: Number(state.throughputMbps.toFixed(1)),
      snrDb: Number(state.snrDb.toFixed(1)),
    },
  };
  device.transportStatus = 'sending';
  device.intendedHealthStatus = state.healthStatus;
  device.lastAttemptAt = sampledAt;
  device.lastPayload = payload;
  device.lastError = null;

  try {
    const response = await fetch(
      `${serverUrl}/api/v1/gateway/devices/${encodeURIComponent(device.id)}/heartbeat`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gatewayToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );
    const responseText = await response.text();
    let responseBody = responseText;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      // Preserve non-JSON error bodies for the console.
    }
    device.lastHttpStatus = response.status;
    device.lastResponse = responseBody;
    if (!response.ok) throw new Error(`${device.id} rejected with HTTP ${response.status}: ${responseText}`);
    device.transportStatus = 'accepted';
    device.lastAcceptedAt = new Date().toISOString();
    device.missedHeartbeats = 0;
    return responseBody;
  } catch (error) {
    device.transportStatus = 'failed';
    device.lastError = error.message;
    throw error;
  }
}

async function runTick() {
  const sampledAt = new Date().toISOString();
  const results = await Promise.allSettled(
    Array.from({ length: deviceCount }, (_, index) => sendHeartbeat(index, sampledAt)),
  );
  const accepted = results.filter((result) => result.status === 'fulfilled' && !result.value.skipped).length;
  const skipped = results.filter((result) => result.status === 'fulfilled' && result.value.skipped).length;
  const failed = results.filter((result) => result.status === 'rejected');
  totals.accepted += accepted;
  totals.skipped += skipped;
  totals.failed += failed.length;
  lastTickAt = sampledAt;
  console.log(`[${sampledAt}] tick=${tick} accepted=${accepted} skipped=${skipped} failed=${failed.length}`);
  for (const result of failed) console.error(result.reason.message);
}

function publicStatus() {
  return {
    running,
    tick,
    startedAt,
    lastTickAt,
    intervalMs,
    serverUrl,
    controlUrl: `http://${controlHost}:${controlPort}`,
    totals,
    devices,
  };
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16 * 1024) throw new Error('Request body exceeds 16 KiB');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function resetSimulator() {
  tick = 0;
  lastTickAt = null;
  totals.accepted = 0;
  totals.skipped = 0;
  totals.failed = 0;
  for (const device of devices) {
    device.mode = 'auto';
    device.transportStatus = 'waiting';
    device.intendedHealthStatus = null;
    device.missedHeartbeats = 0;
    device.lastAttemptAt = null;
    device.lastAcceptedAt = null;
    device.lastHttpStatus = null;
    device.lastPayload = null;
    device.lastResponse = null;
    device.lastError = null;
  }
}

const controlServer = runOnce ? null : createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host ?? `${controlHost}:${controlPort}`}`);
  if (request.method === 'GET' && url.pathname === '/') {
    const html = await readFile(consolePath);
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(html);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/status') {
    sendJson(response, 200, publicStatus());
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/control') {
    try {
      const body = await readJson(request);
      if (body.action === 'pause') running = false;
      else if (body.action === 'resume') running = true;
      else if (body.action === 'reset') {
        resetSimulator();
        running = true;
      } else {
        sendJson(response, 400, { error: 'action must be pause, resume, or reset' });
        return;
      }
      sendJson(response, 200, publicStatus());
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }
  const modeMatch = url.pathname.match(/^\/api\/devices\/([^/]+)\/mode$/);
  if (request.method === 'PUT' && modeMatch) {
    try {
      const id = decodeURIComponent(modeMatch[1]);
      const device = devices.find((candidate) => candidate.id === id);
      if (!device) {
        sendJson(response, 404, { error: 'Simulator device not found' });
        return;
      }
      const body = await readJson(request);
      if (!allowedModes.has(body.mode)) {
        sendJson(response, 400, { error: `mode must be one of: ${[...allowedModes].join(', ')}` });
        return;
      }
      device.mode = body.mode;
      if (body.mode !== 'disconnected') device.missedHeartbeats = 0;
      sendJson(response, 200, device);
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }
  sendJson(response, 404, { error: 'Not found' });
});

if (controlServer) {
  controlServer.listen(controlPort, controlHost, () => {
    console.log(`Simulator Console running at http://${controlHost}:${controlPort}`);
  });
}

process.once('SIGINT', () => { stopping = true; controlServer?.close(); });
process.once('SIGTERM', () => { stopping = true; controlServer?.close(); });

console.log(`SDR device simulator targeting ${serverUrl} with ${deviceCount} devices`);
do {
  if (running) {
    await runTick();
    tick += 1;
  }
  if (!runOnce && !stopping) await wait(running ? intervalMs : Math.min(intervalMs, 500));
} while (!runOnce && !stopping);

console.log('SDR device simulator stopped');
