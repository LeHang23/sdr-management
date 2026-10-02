import { createServer } from 'node:http';
import { previewAuth } from '../src/preview-auth.js';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { inventoryStore, normalizeDevice } from './simulator-inventory.js';
import { randomUUID } from 'node:crypto';

const consolePath = resolve(dirname(fileURLToPath(import.meta.url)), 'console.html');
const allowedModes = new Set(['auto', 'online', 'warning', 'updating', 'disconnected']);

export function createSimulator(config, logger = console) {
  const { serverUrl, gatewayToken, intervalMs, requestTimeoutMs, deviceCount, controlHost, controlPort, runOnce } = config;
  const authorizeConsole = previewAuth(config.consoleUser, config.consolePassword, 'SDR Management preview');
  let stopping = false;
  let generation = 0;
  let activeTick = null;
  let scheduleTimer = null;
  let nextTickAt = null;
  const attempts = new Map();
  let running = true;
  let tick = 0;
  let lastTickAt = null;
  let monitorTimer = null;
  let monitorWork = null;
  const monitorRequests = new Set();
  const startedAt = new Date().toISOString();
  const totals = { accepted: 0, skipped: 0, failed: 0 };

  function deviceId(index) {
    return `SIM-SDR-${String(index + 1).padStart(3, '0')}`;
  }

  const store = inventoryStore(config.statePath, Array.from({ length: deviceCount }, (_, index) => ({ id: deviceId(index) })));
  function createDevice(definition) { return {
    ...definition,
    transportStatus: 'waiting',
    intendedHealthStatus: null,
    missedHeartbeats: 0,
    lastAttemptAt: null,
    lastAcceptedAt: null,
    lastHttpStatus: null,
    lastPayload: null,
    lastResponse: null,
    lastError: null,
    backendState: { available: false, snapshot: null, lastError: null },
  }; }
  const devices = store.state.devices.map(createDevice);
  let jobs = [];
  let jobsError = null;
  function saveInventory(candidate = devices, executions) { store.save(candidate, executions); }

  async function backendRequest(path, options = {}) {
    const controller = new AbortController();
    monitorRequests.add(controller);
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(`${serverUrl}${path}`, {
        ...options, signal: controller.signal,
        headers: { Authorization: `Bearer ${gatewayToken}`, 'Content-Type': 'application/json', ...options.headers },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}`);
      return body;
    } finally { clearTimeout(timer); monitorRequests.delete(controller); }
  }

  async function pollBackend() {
    await Promise.all(devices.map(async (device) => {
      try {
        const snapshot = await backendRequest(`/api/v1/gateway/devices/${encodeURIComponent(device.id)}/status`);
        if (snapshot.deviceId !== device.id || !['online', 'offline'].includes(snapshot.connectionStatus)
          || !['online', 'warning', 'offline', 'updating'].includes(snapshot.healthStatus)
          || !Number.isFinite(Date.parse(snapshot.updatedAt)) || !Number.isFinite(Date.parse(snapshot.checkedAt))) {
          throw new Error('Invalid backend status');
        }
        if (!stopping && devices.includes(device)) device.backendState = { available: true, snapshot, lastError: null };
      } catch (error) {
        if (!stopping && devices.includes(device)) device.backendState = { ...device.backendState, available: false, lastError: error.message };
      }
      if (!stopping && running && devices.includes(device) && device.mode !== 'disconnected' && device.fault === 'normal') {
        try { await receiveCommands(device); }
        catch (error) { device.commandError = error.message; }
      }
    }));
    if (!stopping) {
      try {
        const result = await backendRequest('/api/v1/simulator/jobs');
        if (!Array.isArray(result.jobs)) throw new Error('Invalid job response');
        jobs = result.jobs;
        jobsError = null;
      } catch (error) { if (!stopping) jobsError = error.message; }
    }
  }

  async function receiveCommands(device) {
    const result = await backendRequest(`/api/v1/gateway/devices/${encodeURIComponent(device.id)}/commands`);
    if (!Array.isArray(result.commands)) throw new Error('Invalid commands response');
    for (const command of result.commands) {
      if (stopping || !running || !devices.includes(device) || device.mode === 'disconnected' || device.fault !== 'normal') return;
      if (command.deviceId !== device.id || typeof command.jobId !== 'string' || command.jobId.length > 64
        || !['success', 'failure', 'timeout'].includes(command.outcome) || !Number.isFinite(Date.parse(command.deadlineAt))) throw new Error('Invalid command');
      if (Date.parse(command.deadlineAt) <= Date.now()) continue;
      const key = JSON.stringify([command.jobId, device.id]);
      let execution = store.state.executions[key];
      if (!execution) {
        const definition = normalizeDevice({ ...device, telemetry: { ...device.telemetry, ...command.telemetry } });
        execution = { jobId: command.jobId, deviceId: device.id, status: command.outcome === 'success' ? 'succeeded' : command.outcome === 'failure' ? 'failed' : 'timeout', appliedAt: new Date().toISOString() };
        // Persist the applied configuration and its receipt in one atomic file replacement.
        // A retry (including after restart) must only resend the result, never reapply.
        saveInventory(devices.map((d) => d === device && command.outcome === 'success' ? definition : d), { ...store.state.executions, [key]: execution });
        if (command.outcome === 'success') {
          cancelAttempt(device);
          Object.assign(device, definition);
        }
      }
      device.lastCommand = execution;
      device.commandError = null;
      if (execution.status !== 'timeout') {
        await backendRequest(`/api/v1/gateway/devices/${encodeURIComponent(device.id)}/results`, { method: 'POST', body: JSON.stringify(execution) });
      }
    }
  }

  function monitor() {
    if (stopping || monitorWork) return;
    monitorWork = pollBackend().finally(() => { monitorWork = null; });
  }

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
        ...device.telemetry,
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
      if (device.fault === 'network_loss') throw new Error('Simulated network loss: no request sent');
      if (device.fault === 'timeout') await delay(requestTimeoutMs + 100, undefined, { signal: controller.signal });
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
      dashboardUrl: config.dashboardUrl ?? serverUrl,
      controlUrl: `http://${controlHost}:${controlServer?.address()?.port ?? controlPort}`,
      totals,
      devices,
      jobs, jobsError, persistenceEnabled: Boolean(config.statePath),
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
    saveInventory(devices.map((device) => ({ ...device, mode: 'auto', fault: 'normal', telemetry: {} })));
    invalidateTick();
    tick = 0;
    lastTickAt = null;
    totals.accepted = 0;
    totals.skipped = 0;
    totals.failed = 0;
    for (const device of devices) {
      device.mode = 'auto';
      device.fault = 'normal';
      device.telemetry = {};
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
    if (!authorizeConsole(request, response)) return;
    // Browser Basic credentials are ambient: reject cross-site control submissions.
    if (!['GET', 'HEAD'].includes(request.method) && request.headers.origin) {
      let origin;
      try { origin = new URL(request.headers.origin); } catch {}
      if (!origin || origin.host !== request.headers.host) {
        sendJson(response, 403, { error: 'Cross-origin simulator control is not allowed' });
        return;
      }
    }
    const url = new URL(request.url, `http://${request.headers.host ?? `${controlHost}:${controlPort}`}`);
    if (request.method === 'GET' && url.pathname === '/') {
      const html = await readFile(consolePath);
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(html);
      return;
    }
    if (request.method === 'GET' && ['/console-devices.js', '/console-jobs.js'].includes(url.pathname)) {
      const script = await readFile(new URL(`.${url.pathname}`, import.meta.url));
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(script);
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/status') {
      sendJson(response, 200, publicStatus());
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/jobs') {
      try {
        const body = await readJson(request);
        if (!Array.isArray(body.deviceIds) || body.deviceIds.some((id) => !devices.some((device) => device.id === id))) throw new Error('Choose devices in this simulator inventory');
        const result = await backendRequest('/api/v1/simulator/jobs', { method: 'POST', body: JSON.stringify({ ...body, jobId: body.jobId ?? randomUUID() }) });
        sendJson(response, 202, result);
      } catch (error) { sendJson(response, 400, { error: error.message }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/devices') {
      try {
        const definition = normalizeDevice(await readJson(request));
        if (devices.some((d) => d.id === definition.id)) { sendJson(response, 409, { error: 'Device ID already exists' }); return; }
        const device = createDevice(definition);
        saveInventory([...devices, device]);
        devices.push(device);
        sendJson(response, 201, publicStatus());
      } catch (error) { sendJson(response, 400, { error: error.message }); }
      return;
    }
    const inventoryMatch = url.pathname.match(/^\/api\/devices\/([^/]+)$/);
    if (inventoryMatch && ['PUT', 'DELETE'].includes(request.method)) {
      try {
        const device = devices.find((d) => d.id === decodeURIComponent(inventoryMatch[1]));
        if (!device) { sendJson(response, 404, { error: 'Simulator device not found' }); return; }
        if (request.method === 'DELETE') {
          saveInventory(devices.filter((d) => d !== device));
          cancelAttempt(device);
          devices.splice(devices.indexOf(device), 1);
        } else {
          const body = await readJson(request);
          if (body.id !== undefined && body.id !== device.id) throw new Error('Device ID cannot be changed; add a new device instead');
          const next = normalizeDevice({ ...device, ...body });
          saveInventory(devices.map((d) => d === device ? next : d));
          cancelAttempt(device);
          Object.assign(device, next);
        }
        sendJson(response, 200, publicStatus());
      } catch (error) { sendJson(response, 400, { error: error.message }); }
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
        saveInventory(devices.map((d) => d === device ? { ...d, mode: body.mode } : d));
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
    if (config.monitorEnabled !== false) {
      monitorTimer = setInterval(monitor, config.backendPollIntervalMs ?? 1000);
    }
  }

  async function stop() {
    stopping = true;
    running = false;
    invalidateTick();
    clearInterval(monitorTimer);
    for (const controller of monitorRequests) controller.abort();
    const closed = controlServer?.listening ? new Promise((resolve, reject) => {
      controlServer.close((error) => error ? reject(error) : resolve());
      controlServer.closeAllConnections();
    }) : Promise.resolve();
    await Promise.all([activeTick, monitorWork, closed]);
  }

  return { start, stop, status: publicStatus, controlServer };
}
