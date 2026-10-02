import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as wait } from 'node:timers/promises';

const password = 'hosted-preview-test-password';
const authorization = `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`;

async function hosted(t, overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'sdr-hosted-test-'));
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const url = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['backend/scripts/hosted-preview.js'], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), SDR_DATABASE_PATH: join(directory, 'demo.db'), SDR_SIMULATOR_STATE_PATH: join(directory, 'simulator.json'), SDR_PREVIEW_PASSWORD: password, SDR_PREVIEW_USER: 'admin', SDR_GATEWAY_TOKEN: 'hosted-test-token', SDR_SIMULATOR_DEVICE_COUNT: '2', SDR_SIMULATOR_INTERVAL_MS: '250', SDR_SIMULATOR_REQUEST_TIMEOUT_MS: '200', SDR_DASHBOARD_PUBLIC_URL: 'https://sdr-demo.example', ...overrides },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let exited = false;
  const closed = new Promise((resolve) => child.once('close', (code) => { exited = true; resolve(code); }));
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  t.after(async () => {
    if (!exited) {
      child.kill('SIGTERM');
      const timer = setTimeout(() => child.kill('SIGKILL'), 2000);
      await closed;
      clearTimeout(timer);
    }
    await rm(directory, { recursive: true, force: true });
  });
  const request = async (path, options = {}, authenticated = true) => fetch(url + path, {
    ...options, headers: { ...(authenticated ? { Authorization: authorization } : {}), ...options.headers }, signal: AbortSignal.timeout(2000),
  });
  return { child, closed, url, request, output: () => output, exited: () => exited };
}

async function until(predicate, description) {
  for (let i = 0; i < 80; i += 1) {
    if (await predicate()) return;
    await wait(50);
  }
  assert.fail(description);
}

test('hosted preview serves authenticated Dashboard and Console through one public port', async (t) => {
  const app = await hosted(t);
  await until(() => app.output().includes('Hosted preview ready'), 'Hosted startup failed: ' + app.output());
  assert.equal((await app.request('/health', {}, false)).status, 200);
  for (const path of ['/', '/api/v1/overview/summary', '/simulator/', '/simulator/api/status']) {
    assert.equal((await app.request(path, {}, false)).status, 401, path);
  }
  assert.equal((await app.request('/simulator/api/control', { method: 'POST', body: '{"action":"pause"}' }, false)).status, 401);
  assert.equal((await app.request('/simulator/api/devices/SIM-SDR-001/mode', { method: 'PUT', body: '{"mode":"warning"}' }, false)).status, 401);
  assert.equal((await app.request('/simulator/', { headers: { Authorization: 'Basic wrong' } })).status, 401);
  const dashboard = await app.request('/');
  assert.equal(dashboard.status, 200);
  assert.match(await dashboard.text(), /SDR Management/);
  const redirect = await app.request('/simulator', { redirect: 'manual' });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/simulator/');
  const page = await app.request('/simulator/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /fetch\('\.\/api\/status'/);
  const status = () => app.request('/simulator/api/status').then((response) => response.json());
  await until(async () => (await status()).totals.accepted >= 2, 'Simulator did not ingest two demo devices');
  const snapshot = await status();
  assert.equal(snapshot.dashboardUrl, 'https://sdr-demo.example');
  assert.ok(!JSON.stringify(snapshot).includes(password));
  assert.ok(!JSON.stringify(snapshot).includes('hosted-test-token'));
  const summary = await (await app.request('/api/v1/overview/summary')).json();
  assert.equal(summary.metrics.totalDevices, 2);
  assert.equal(summary.metrics.onlineNow, 2);
  const control = (action, origin = app.url) => app.request('/simulator/api/control', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
  assert.equal((await control('pause', 'https://cross-site.example')).status, 403);
  assert.equal((await control('pause')).status, 200);
  assert.equal((await status()).running, false);
  assert.equal((await app.request('/simulator/api/devices/SIM-SDR-001/mode', { method: 'PUT', headers: { Origin: app.url, 'Content-Type': 'application/json' }, body: '{"mode":"warning"}' })).status, 200);
  assert.equal((await control('resume')).status, 200);
  await until(async () => (await status()).devices[0].lastPayload.healthStatus === 'warning', 'Mode did not reach payload');
  const heartbeat = '/api/v1/gateway/devices/TEST-DEVICE/heartbeat';
  assert.equal((await app.request(heartbeat, { method: 'POST', body: '{}' }, false)).status, 401);
  assert.equal((await app.request(heartbeat, { method: 'POST', headers: { Authorization: 'Bearer hosted-test-token', 'Content-Type': 'application/json' }, body: '{"healthStatus":"online"}' }, false)).status, 202);
  const beforeStop = Date.now();
  app.child.kill('SIGTERM');
  assert.equal(await app.closed, 0);
  assert.ok(Date.now() - beforeStop < 2000);
});

test('hosted mode fails closed without a strong preview password', async (t) => {
  for (const value of ['', 'short']) {
    const app = await hosted(t, { SDR_PREVIEW_PASSWORD: value });
    assert.equal(await app.closed, 1);
    assert.match(app.output(), /password|PASSWORD/i);
  }
});

test('combined preview manages inventory and simulated commands end to end with auth and source labels', async (t) => {
  const app = await hosted(t);
  await until(() => app.output().includes('Hosted preview ready'), 'Hosted startup failed: ' + app.output());
  const status = () => app.request('/simulator/api/status').then((r) => r.json());
  const json = (path, method, body, origin = app.url) => app.request(path, { method, headers: { Origin: origin, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  assert.equal((await app.request('/simulator/console-devices.js', {}, false)).status, 401);
  assert.equal((await app.request('/simulator/console-devices.js')).status, 200);
  assert.equal((await json('/simulator/api/devices', 'POST', { id: 'SIM-SDR-extra' }, 'https://attacker.example')).status, 403);
  assert.equal((await json('/simulator/api/devices', 'POST', { id: 'SIM-SDR-extra', displayName: 'Lab device' })).status, 201);
  await until(async () => (await status()).devices.find((d) => d.id === 'SIM-SDR-extra')?.backendState.available, 'No backend-confirmed state');
  const direct = '/api/v1/gateway/devices/SIM-SDR-extra/status';
  assert.equal((await app.request(direct)).status, 401, 'Preview credentials must not authorize gateway reads');
  assert.equal((await app.request(direct, { headers: { Authorization: 'Bearer hosted-test-token' } }, false)).status, 200);
  for (const [outcome, expected] of [['success', 'succeeded'], ['failure', 'failed'], ['timeout', 'failed']]) {
    const jobId = `e2e-${outcome}`;
    const response = await json('/simulator/api/jobs', 'POST', { jobId, deviceIds: ['SIM-SDR-extra'], telemetry: { snrDb: 25 }, outcome, timeoutMs: outcome === 'timeout' ? 1000 : 5000 });
    assert.equal(response.status, 202, await response.text());
    await until(async () => (await status()).jobs.find((job) => job.jobId === jobId)?.status === expected, `${outcome} did not complete`);
  }
  assert.equal((await status()).devices.find((d) => d.id === 'SIM-SDR-extra').telemetry.snrDb, 25);
  assert.equal((await (await app.request('/api/v1/overview/summary')).json()).source.mode, 'simulator');
  const serialized = JSON.stringify(await status());
  assert.ok(!serialized.includes('hosted-test-token'));
  assert.ok(!serialized.includes(password));
  assert.equal((await json('/simulator/api/devices/SIM-SDR-extra', 'DELETE')).status, 200);
  assert.ok(!(await status()).devices.some((d) => d.id === 'SIM-SDR-extra'));
  const summary = await (await app.request('/api/v1/overview/summary')).json();
  assert.equal(summary.metrics.totalDevices, 3, 'Simulator deletion retains backend history');
});
