import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const consolePath = resolve(dirname(fileURLToPath(import.meta.url)), 'console.html');
const allowedModes = new Set(['auto', 'online', 'warning', 'updating', 'disconnected']);

export function createSimulator(config, logger = console) {
  const { serverUrl, gatewayToken, intervalMs, requestTimeoutMs, deviceCount, controlHost, controlPort, runOnce } = config;
  let stopping = false;
  let generation = 0;
  let activeTick = null;
  let scheduleTimer = null;
  let nextTickAt = null;
  const attempts = new Map();
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

  async function sendHeartbeat(index, sampledAt, currentTick) {
    const device = devices[index];
    if (shouldSkipHeartbeat(index, currentTick)) {
      device.transportStatus = 'skipped';
      device.missedHeartbeats += 1;
      device.lastError = device.mode === 'disconnected'
        ? 'Disconnected by Simulator Console'
        : 'Automatic disconnect scenario';
      return { deviceId: device.id, skipped: true };
    }

    const state = forcedDeviceState(index, currentTick, device.mode);
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
    device.lastHttpStatus = null;
    device.lastResponse = null;
    const controller = new AbortController();
    attempts.set(device.id, controller);
    const deadline = setTimeout(() => controller.abort(new Error(`Heartbeat timed out after ${requestTimeoutMs} ms`)), requestTimeoutMs);
    const isCurrent = () => attempts.get(device.id) === controller;

    try {
      const response = await fetch(
        `${serverUrl}/api/v1/gateway/devices/${encodeURIComponent(device.id)}/heartbeat`,
        {
          method: 'POST',
          signal: controller.signal,
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
      if (!isCurrent()) return { cancelled: true };
      device.lastHttpStatus = response.status;
      device.lastResponse = responseBody;
      if (!response.ok) throw new Error(`${device.id} rejected with HTTP ${response.status}: ${responseText}`);
      device.transportStatus = 'accepted';
      device.lastAcceptedAt = new Date().toISOString();
      device.missedHeartbeats = 0;
      return { accepted: true };
    } catch (error) {
      if (!isCurrent()) return { cancelled: true };
      device.transportStatus = 'failed';
      device.missedHeartbeats += 1;
      device.lastError = controller.signal.aborted ? controller.signal.reason.message : error.message;
      throw new Error(device.lastError);
    } finally {
      clearTimeout(deadline);
      if (isCurrent()) attempts.delete(device.id);
    }
  }

  async function runTick() {
    const tickGeneration = generation;
    const currentTick = tick;
    const sampledAt = new Date().toISOString();
    const results = await Promise.allSettled(
      devices.map((_, index) => sendHeartbeat(index, sampledAt, currentTick)),
    );
    if (tickGeneration !== generation) return { cancelled: true };
    const accepted = results.filter((result) => result.status === 'fulfilled' && !result.value.skipped && !result.value.cancelled).length;
    const skipped = results.filter((result) => result.status === 'fulfilled' && result.value.skipped).length;
    const failed = results.filter((result) => result.status === 'rejected');
    totals.accepted += accepted;
    totals.skipped += skipped;
    totals.failed += failed.length;
    lastTickAt = sampledAt;
    tick += 1;
    logger.log(`[${sampledAt}] tick=${currentTick} accepted=${accepted} skipped=${skipped} failed=${failed.length}`);
    for (const result of failed) logger.error(result.reason.message);
    return { accepted, skipped, failed: failed.length };
  }

  function cancelAttempt(device) {
    const controller = attempts.get(device.id);
    attempts.delete(device.id);
    controller?.abort(new Error('Cancelled by simulator control'));
    if (device.transportStatus === 'sending') {
      device.transportStatus = 'cancelled';
      device.lastError = 'Cancelled by simulator control; backend acceptance is unknown';
    }
  }

  function invalidateTick() {
    generation += 1;
    devices.forEach(cancelAttempt);
    clearTimeout(scheduleTimer);
    nextTickAt = null;
  }

  function schedule() {
    clearTimeout(scheduleTimer);
    if (stopping || !running || activeTick || runOnce) return;
    scheduleTimer = setTimeout(pump, Math.max(0, nextTickAt - Date.now()));
  }

  function pump() {
    if (stopping || !running || activeTick) return;
    const dueAt = nextTickAt ?? Date.now();
    const tickGeneration = generation;
    nextTickAt = null;
    activeTick = runTick().finally(() => {
      activeTick = null;
      if (!stopping && running && !runOnce) {
        if (tickGeneration === generation) {
          // Keep start-to-start cadence; skip elapsed slots rather than burst or overlap.
          nextTickAt = dueAt + (Math.floor((Date.now() - dueAt) / intervalMs) + 1) * intervalMs;
        } else {
          nextTickAt = Date.now();
        }
        schedule();
      }
    });
  }

  function publicStatus() {
    return {
      running,
      tick,
      startedAt,
      lastTickAt,
      intervalMs,
      requestTimeoutMs,
      recommendedHeartbeatTimeoutMs: intervalMs * 3,
      nextTickAt: nextTickAt === null ? null : new Date(nextTickAt).toISOString(),
      sending: Boolean(activeTick),
      serverUrl,
      controlUrl: `http://${controlHost}:${controlServer?.address()?.port ?? controlPort}`,
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
    invalidateTick();
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
        if (body.action === 'pause') {
          running = false;
          invalidateTick();
        } else if (body.action === 'resume') {
          if (!running) {
            running = true;
            nextTickAt = Date.now();
            schedule();
          }
        } else if (body.action === 'reset') {
          resetSimulator();
          running = true;
          nextTickAt = Date.now();
          schedule();
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
        cancelAttempt(device);
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


  async function start() {
    if (controlServer) {
      await new Promise((resolve, reject) => {
        controlServer.once('error', reject);
        controlServer.listen(controlPort, controlHost, resolve);
      });
      logger.log(`Simulator Console running at http://${controlHost}:${controlServer.address().port}`);
    }
    logger.log(`SDR device simulator targeting ${serverUrl} with ${deviceCount} devices`);
    if (runOnce) {
      activeTick = runTick();
      try { return await activeTick; } finally { activeTick = null; }
    }
    nextTickAt = Date.now();
    schedule();
  }

  async function stop() {
    stopping = true;
    running = false;
    invalidateTick();
    const closed = controlServer?.listening ? new Promise((resolve, reject) => {
      controlServer.close((error) => error ? reject(error) : resolve());
      controlServer.closeAllConnections();
    }) : Promise.resolve();
    await Promise.all([activeTick, closed]);
  }

  return { start, stop, status: publicStatus, controlServer };
}
