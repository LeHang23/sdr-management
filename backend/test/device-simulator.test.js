import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { readSimulatorConfig } from '../simulator/simulator-config.js';
import { createSimulator } from '../simulator/simulator-runtime.js';

const silent = { log() {}, error() {} };
async function backend(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}
function config(serverUrl, extra = {}) {
  return { ...readSimulatorConfig({ SDR_GATEWAY_TOKEN: 'test-token', SDR_SERVER_URL: serverUrl }), controlPort: 0, deviceCount: 1, monitorEnabled: false, intervalMs: 250, requestTimeoutMs: 150, ...extra };
}
async function simulator(t, serverUrl, extra) {
  const instance = createSimulator(config(serverUrl, extra), silent);
  t.after(() => instance.stop());
  await instance.start();
  const url = instance.status().controlUrl;
  return { instance, url, control: (action) => json(`${url}/api/control`, 'POST', { action }), mode: (mode, id = 'SIM-SDR-001') => json(`${url}/api/devices/${id}/mode`, 'PUT', { mode }) };
}
async function json(url, method, body) {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(2000) });
  return { status: response.status, body: await response.json() };
}
async function until(predicate, message = 'Condition was not met') {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await wait(10);
  }
  assert.fail(message);
}
async function cli(url, extra = {}, args = ['--once'], file = 'backend/simulator/device-simulator.js') {
  const child = spawn(process.execPath, [file, ...args], { env: { ...process.env, SDR_GATEWAY_TOKEN: 'test-token', SDR_SERVER_URL: url, SDR_SIMULATOR_DEVICE_COUNT: '1', SDR_SIMULATOR_REQUEST_TIMEOUT_MS: '100', ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  const timer = setTimeout(() => child.kill('SIGKILL'), 4000);
  try {
    return await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code, signal) => resolve({ code, signal, output }));
    });
  } finally { clearTimeout(timer); }
}

test('rejects invalid configuration instead of silently creating a wrong fleet', () => {
  for (const count of ['abc', 'NaN', '0', '-1', '1.5', '101', 'Infinity', '']) {
    assert.throws(() => readSimulatorConfig({ SDR_GATEWAY_TOKEN: 'x', SDR_SIMULATOR_DEVICE_COUNT: count }), /DEVICE_COUNT/);
  }
  for (const [key, values] of Object.entries({ SDR_SIMULATOR_INTERVAL_MS: ['249', '250.5', 'Infinity', '2147483648'], SDR_SIMULATOR_REQUEST_TIMEOUT_MS: ['0', '-1', 'NaN', '1.5'], SDR_SIMULATOR_CONTROL_PORT: ['0', '65536', '2.5'] })) {
    for (const value of values) assert.throws(() => readSimulatorConfig({ SDR_GATEWAY_TOKEN: 'x', [key]: value }), new RegExp(key));
  }
  for (const url of ['ftp://host', 'http://user:password@host', 'http://host/?token=secret', 'bad']) {
    assert.throws(() => readSimulatorConfig({ SDR_GATEWAY_TOKEN: 'x', SDR_SERVER_URL: url }));
  }
  assert.throws(() => readSimulatorConfig({ SDR_GATEWAY_TOKEN: ' ' }), /TOKEN/);
  assert.throws(() => readSimulatorConfig({ SDR_GATEWAY_TOKEN: 'x', SDR_SIMULATOR_CONSOLE_PASSWORD: 'short' }), /PASSWORD/);
  assert.throws(() => readSimulatorConfig({ SDR_GATEWAY_TOKEN: 'x', SDR_DASHBOARD_PUBLIC_URL: 'http://user:pass@host' }), /PUBLIC_URL/);
  assert.equal(readSimulatorConfig({ SDR_GATEWAY_TOKEN: 'x', SDR_SIMULATOR_DEVICE_COUNT: '100' }).deviceCount, 100);
});

test('one-shot sends authenticated telemetry and exits according to HTTP results', async (t) => {
  let status = 202;
  const url = await backend(t, async (request, response) => {
    assert.equal(request.headers.authorization, 'Bearer test-token');
    assert.equal(request.url, '/api/v1/gateway/devices/SIM-SDR-001/heartbeat');
    let body = '';
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    assert.equal(payload.healthStatus, 'online');
    assert.ok(Number.isFinite(payload.telemetry.throughputMbps));
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(status === 202 ? { deviceId: 'SIM-SDR-001' } : { error: 'Rejected' }));
  });
  assert.equal((await cli(url)).code, 0);
  for (const code of [401, 503]) {
    status = code;
    const result = await cli(url);
    assert.equal(result.code, 1);
    assert.match(result.output, new RegExp(`HTTP ${code}`));
  }
  status = 202;
  const mixedUrl = await backend(t, (request, response) => {
    response.writeHead(request.url.includes('SIM-SDR-002') ? 503 : 202);
    response.end('{}');
  });
  assert.equal((await cli(mixedUrl, { SDR_SIMULATOR_DEVICE_COUNT: '2' })).code, 1);
  assert.equal((await cli(url, { SDR_SIMULATOR_DEVICE_COUNT: 'bad' })).code, 1);
});

test('request deadline covers response headers and body; continuous mode recovers', async (t) => {
  let behavior = 'headers';
  let concurrent = 0;
  let peak = 0;
  const url = await backend(t, (request, response) => {
    concurrent += 1;
    peak = Math.max(peak, concurrent);
    response.once('close', () => { concurrent -= 1; });
    if (behavior === 'body') {
      response.writeHead(202, { 'Content-Type': 'application/json' });
      response.flushHeaders();
      response.write('{');
    } else if (behavior === 'success') {
      response.writeHead(202, { 'Content-Type': 'application/json' });
      response.end('{"accepted":true}');
    }
  });
  for (const mode of ['headers', 'body']) {
    behavior = mode;
    const result = await cli(url);
    assert.equal(result.code, 1);
    assert.match(result.output, /timed out/);
  }
  const { instance } = await simulator(t, url);
  await until(() => instance.status().totals.failed >= 1);
  assert.match(instance.status().devices[0].lastError, /timed out/);
  behavior = 'success';
  await until(() => instance.status().totals.accepted >= 1);
  assert.equal(instance.status().devices[0].lastError, null);
  assert.equal(instance.status().devices[0].missedHeartbeats, 0);
  assert.equal(peak, 1);
});

test('connection refusal exits nonzero; invalid backend timeout fails before opening DB', async (t) => {
  const temporary = createServer();
  await new Promise((resolve) => temporary.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${temporary.address().port}`;
  await new Promise((resolve) => temporary.close(resolve));
  assert.equal((await cli(url)).code, 1);
  for (const timeout of ['0', 'NaN', '1.5']) {
    const result = await cli(url, { SDR_HEARTBEAT_TIMEOUT_MS: timeout }, [], 'backend/src/server.js');
    assert.equal(result.code, 1);
    assert.match(result.output, /HEARTBEAT_TIMEOUT_MS/);
  }
});

test('Console pause/resume/reset and mode API preserve control state during in-flight requests', async (t) => {
  const responses = [];
  const url = await backend(t, (request, response) => { responses.push(response); });
  const { instance, control, mode, url: consoleUrl } = await simulator(t, url, { intervalMs: 1000, requestTimeoutMs: 2000 });
  await until(() => responses.length === 1);
  let result = await control('pause');
  assert.equal(result.body.running, false);
  assert.equal(result.body.nextTickAt, null);
  await until(() => !instance.status().sending);
  const paused = JSON.stringify(instance.status());
  responses[0].end('{"old":true}');
  await wait(50);
  assert.equal(JSON.stringify(instance.status()), paused);
  assert.equal(instance.status().totals.failed, 0);
  assert.equal((await control('resume')).body.running, true);
  await until(() => responses.length === 2);
  assert.equal((await mode('warning')).status, 200);
  await until(() => !instance.status().sending);
  responses[1].end('{"old":true}');
  assert.equal(instance.status().devices[0].mode, 'warning');
  assert.equal(instance.status().devices[0].lastResponse, null);
  const reset = await control('reset');
  assert.deepEqual(reset.body.totals, { accepted: 0, skipped: 0, failed: 0 });
  assert.equal(reset.body.devices[0].mode, 'auto');
  await until(() => responses.length === 3);
  // Reset while an actual request is still pending; its eventual completion must be ignored.
  await control('reset');
  await until(() => responses.length === 4);
  responses[2].end('{"stale":true}');
  await wait(30);
  assert.deepEqual(instance.status().totals, { accepted: 0, skipped: 0, failed: 0 });
  assert.equal(instance.status().devices[0].lastResponse, null);
  responses[3].writeHead(202, { 'Content-Type': 'application/json' });
  responses[3].end('{"fresh":true}');
  await until(() => instance.status().totals.accepted === 1);
  assert.deepEqual(instance.status().devices[0].lastResponse, { fresh: true });
  assert.equal((await mode('bad')).status, 400);
  assert.equal((await mode('online', 'missing')).status, 404);
  assert.equal((await control('bad')).status, 400);
  const status = await (await fetch(`${consoleUrl}/api/status`)).text();
  assert.ok(!status.includes('test-token'));
  assert.equal(instance.status().recommendedHeartbeatTimeoutMs, 3000);
  assert.ok(Date.parse(instance.status().nextTickAt) > Date.now());
  const page = await (await fetch(consoleUrl)).text();
  assert.match(page, /Backend status is read independently/);
});

test('forced modes reach heartbeat payload and disconnected mode skips until recovery', async (t) => {
  const payloads = [];
  const url = await backend(t, async (request, response) => {
    let raw = '';
    for await (const chunk of request) raw += chunk;
    payloads.push(JSON.parse(raw));
    response.writeHead(202, { 'Content-Type': 'application/json' });
    response.end('{}');
  });
  const { instance, control, mode } = await simulator(t, url);
  await until(() => instance.status().totals.accepted >= 1);
  await control('pause');
  for (const state of ['warning', 'updating', 'online']) {
    await mode(state);
    const before = payloads.length;
    await control('resume');
    await until(() => payloads.length > before && !instance.status().sending);
    assert.equal(payloads.at(-1).healthStatus, state);
    await control('pause');
  }
  await mode('disconnected');
  const before = payloads.length;
  await control('resume');
  await until(() => instance.status().totals.skipped >= 1);
  assert.equal(payloads.length, before);
  await mode('online');
  await until(() => payloads.length > before && !instance.status().sending);
  assert.equal(instance.status().devices[0].missedHeartbeats, 0);
});

test('slow batches skip elapsed slots instead of overlapping or sending bursts', async (t) => {
  const starts = [];
  const url = await backend(t, (request, response) => {
    starts.push(Date.now());
    setTimeout(() => {
      response.writeHead(202);
      response.end('null');
    }, 400);
  });
  const { instance } = await simulator(t, url, { requestTimeoutMs: 800 });
  await until(() => instance.status().totals.accepted >= 2);
  assert.ok(starts[1] - starts[0] >= 450, 'The next batch must wait for the next cadence slot');
  assert.equal(instance.status().totals.failed, 0);
});

test('shutdown cancels pending requests without waiting for a long interval or deadline', async (t) => {
  const url = await backend(t, () => {});
  const { instance } = await simulator(t, url, { intervalMs: 60_000, requestTimeoutMs: 60_000 });
  await until(() => instance.status().devices[0].transportStatus === 'sending');
  const started = Date.now();
  await instance.stop();
  assert.ok(Date.now() - started < 1000);
  assert.equal(instance.controlServer.listening, false);
  assert.equal(instance.status().nextTickAt, null);
});

test('remote Console authenticates every route, rejects cross-site control and hides credentials', async (t) => {
  const backendUrl = await backend(t, (request, response) => { response.writeHead(202); response.end('{}'); });
  const password = 'test-console-password';
  const { instance, url } = await simulator(t, backendUrl, {
    consoleUser: 'admin', consolePassword: password, dashboardUrl: 'https://demo-dashboard.example',
  });
  const authorization = `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`;
  for (const [path, method, body] of [['/', 'GET'], ['/api/status', 'GET'], ['/api/control', 'POST', '{"action":"pause"}'], ['/api/devices/SIM-SDR-001/mode', 'PUT', '{"mode":"warning"}']]) {
    const response = await fetch(url + path, { method, body });
    assert.equal(response.status, 401);
    assert.match(response.headers.get('www-authenticate'), /Basic/);
  }
  assert.equal((await fetch(url, { headers: { Authorization: 'Basic wrong' } })).status, 401);
  const statusResponse = await fetch(`${url}/api/status`, { headers: { Authorization: authorization } });
  const status = await statusResponse.json();
  assert.equal(status.dashboardUrl, 'https://demo-dashboard.example');
  assert.equal(status.serverUrl, backendUrl);
  assert.ok(!JSON.stringify(status).includes(password));
  assert.ok(!JSON.stringify(status).includes('test-token'));
  const crossSite = await fetch(`${url}/api/control`, { method: 'POST', headers: { Authorization: authorization, Origin: 'https://attacker.example', 'Content-Type': 'application/json' }, body: '{"action":"pause"}' });
  assert.equal(crossSite.status, 403);
  assert.equal(instance.status().running, true);
  const sameSite = await fetch(`${url}/api/control`, { method: 'POST', headers: { Authorization: authorization, Origin: url, 'Content-Type': 'application/json' }, body: '{"action":"pause"}' });
  assert.equal(sameSite.status, 200);
  assert.equal(instance.status().running, false);
});


test('real backend ingestion updates Overview, expires paused devices and recovers after resume', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'sdr-simulator-test-'));
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const url = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['backend/src/server.js'], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), SDR_GATEWAY_TOKEN: 'test-token', SDR_DATABASE_PATH: join(directory, 'test.db'), SDR_HEARTBEAT_TIMEOUT_MS: '750', SDR_SEED_DEMO: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let exited = false;
  child.on('close', () => { exited = true; });
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  t.after(async () => {
    if (!exited) {
      const closed = new Promise((resolve) => child.once('close', resolve));
      child.kill('SIGTERM');
      const killTimer = setTimeout(() => child.kill('SIGKILL'), 2000);
      await closed;
      clearTimeout(killTimer);
    }
    await rm(directory, { recursive: true, force: true });
  });
  await until(() => output.includes('SDR Management running'), 'Backend did not start: ' + output);
  const { instance, control } = await simulator(t, url, { monitorEnabled: true, backendPollIntervalMs: 100 });
  await until(() => instance.status().totals.accepted >= 1);
  await until(() => instance.status().devices[0].backendState.available);
  assert.equal(instance.status().devices[0].backendState.snapshot.connectionStatus, 'online');
  const summary = () => fetch(`${url}/api/v1/overview/summary`).then((response) => response.json());
  assert.equal((await summary()).metrics.onlineNow, 1);
  await control('pause');
  let snapshot;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    snapshot = await summary();
    if (snapshot.metrics.onlineNow === 0) break;
    await wait(100);
  }
  assert.equal(snapshot.metrics.onlineNow, 0);
  assert.equal(snapshot.details.healthCounts.offline, 1);
  await until(() => instance.status().devices[0].backendState.snapshot?.connectionStatus === 'offline');
  const before = instance.status().totals.accepted;
  await control('resume');
  await until(() => instance.status().totals.accepted > before);
  assert.equal((await summary()).metrics.onlineNow, 1);
});


test('backend status becomes unknown on read failure and retains a stale snapshot without inferring Offline', async (t) => {
  let available = true;
  const url = await backend(t, (request, response) => {
    if (request.url.endsWith('/status')) {
      response.writeHead(available ? 200 : 503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(available ? {
        deviceId: 'SIM-SDR-001', connectionStatus: 'online', healthStatus: 'warning',
        updatedAt: new Date().toISOString(), checkedAt: new Date().toISOString(),
      } : { error: 'Unavailable' }));
    } else { response.writeHead(202); response.end('{}'); }
  });
  const { instance } = await simulator(t, url, { monitorEnabled: true, backendPollIntervalMs: 50 });
  await until(() => instance.status().devices[0].backendState.available);
  available = false;
  await until(() => !instance.status().devices[0].backendState.available);
  assert.equal(instance.status().devices[0].backendState.snapshot.connectionStatus, 'online');
  assert.match(instance.status().devices[0].backendState.lastError, /503/);
  available = true;
  await until(() => instance.status().devices[0].backendState.available);
});
