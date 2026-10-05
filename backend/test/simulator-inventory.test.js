import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as wait } from 'node:timers/promises';
import { createSimulator } from '../simulator/simulator-runtime.js';
import { readSimulatorConfig } from '../simulator/simulator-config.js';
import { inventoryStore } from '../simulator/simulator-inventory.js';

async function until(check) {
  for (let i = 0; i < 150; i++) { if (await check()) return; await wait(20); }
  assert.fail('Condition not reached');
}
async function fixture(t, handler) {
  const dir = await mkdtemp(join(tmpdir(), 'sdr-inventory-'));
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const backend = `http://127.0.0.1:${server.address().port}`;
  const config = { ...readSimulatorConfig({ SDR_GATEWAY_TOKEN: 'inventory-test-token', SDR_SERVER_URL: backend }),
    controlPort: 0, deviceCount: 1, intervalMs: 250, requestTimeoutMs: 100, monitorEnabled: false, statePath: join(dir, 'state.json') };
  const instances = [];
  t.after(async () => {
    for (const instance of instances) await instance.stop();
    await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); });
    await rm(dir, { recursive: true, force: true });
  });
  return { config, dir, async start(overrides = {}) {
    const instance = createSimulator({ ...config, ...overrides }, { log() {}, error() {} });
    instances.push(instance); await instance.start();
    const request = async (path, method, body) => {
      const response = await fetch(instance.status().controlUrl + path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, body: await response.json() };
    };
    return { instance, request };
  } };
}

test('inventory CRUD validates IDs, persists edits and deletion across restart, and leaves backend history alone', async (t) => {
  const f = await fixture(t, (req, res) => { res.writeHead(202); res.end('{}'); });
  const first = await f.start();
  assert.equal((await first.request('/api/devices', 'POST', { id: 'PHYSICAL-001' })).status, 400);
  assert.equal((await first.request('/api/devices', 'POST', { id: 'SIM-SDR-extra', displayName: '<safe name>', metadata: { location: 'Lab' } })).status, 201);
  assert.equal((await first.request('/api/devices', 'POST', { id: 'SIM-SDR-extra' })).status, 409);
  assert.equal((await first.request('/api/devices/SIM-SDR-extra', 'PUT', { telemetry: { snrDb: 201 } })).status, 400);
  assert.equal((await first.request('/api/devices/SIM-SDR-extra', 'PUT', { id: 'SIM-SDR-renamed' })).status, 400);
  assert.equal((await first.request('/api/devices/SIM-SDR-extra', 'PUT', { telemetry: { throughputMbps: 0, snrDb: -5 }, fault: 'network_loss' })).status, 200);
  assert.equal((await first.request('/api/devices/SIM-SDR-001', 'DELETE')).status, 200);
  await first.instance.stop();
  const restarted = await f.start();
  const device = restarted.instance.status().devices[0];
  assert.equal(restarted.instance.status().devices.length, 1);
  assert.equal(device.displayName, '<safe name>');
  assert.equal(device.metadata.location, 'Lab');
  assert.deepEqual(device.telemetry, { throughputMbps: 0, snrDb: -5 });
  assert.equal(device.fault, 'network_loss');
  assert.ok(!(await readFile(f.config.statePath, 'utf8')).includes('inventory-test-token'));
  await restarted.request('/api/devices/SIM-SDR-extra', 'DELETE');
  await restarted.instance.stop();
  const empty = await f.start();
  assert.equal(empty.instance.status().devices.length, 0, 'An intentionally empty saved fleet stays empty');
});

test('network loss and timeout faults send no request and recover with custom telemetry', async (t) => {
  const received = [];
  const f = await fixture(t, async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    received.push(JSON.parse(raw)); res.writeHead(202); res.end('{}');
  });
  const { instance, request } = await f.start();
  await until(() => instance.status().totals.accepted > 0);
  for (const fault of ['network_loss', 'timeout']) {
    await request('/api/devices/SIM-SDR-001', 'PUT', { fault });
    const before = instance.status().totals.failed;
    await until(() => instance.status().totals.failed > before);
    assert.match(instance.status().devices[0].lastError, fault === 'timeout' ? /timed out/ : /network loss/);
  }
  await request('/api/devices/SIM-SDR-001', 'PUT', { fault: 'normal', telemetry: { throughputMbps: 0, snrDb: -1 } });
  await until(() => received.at(-1).telemetry.snrDb === -1);
  assert.equal(received.at(-1).telemetry.throughputMbps, 0);
});

test('command redelivery after restart retries results without applying the configuration twice', async (t) => {
  let acknowledge = false;
  let resultAttempts = 0;
  const command = { jobId: 'retry-job', deviceId: 'SIM-SDR-001', telemetry: { snrDb: 25 }, outcome: 'success', deadlineAt: new Date(Date.now() + 30000).toISOString() };
  const f = await fixture(t, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url.endsWith('/status')) res.end(JSON.stringify({ deviceId: 'SIM-SDR-001', connectionStatus: 'online', healthStatus: 'online', updatedAt: new Date().toISOString(), checkedAt: new Date().toISOString() }));
    else if (req.url.endsWith('/commands')) res.end(JSON.stringify({ commands: [command] }));
    else if (req.url.endsWith('/results')) {
      resultAttempts++; res.writeHead(acknowledge ? 200 : 503); res.end('{}');
    } else if (req.url.endsWith('/jobs')) res.end('{"jobs":[]}');
    else { res.writeHead(202); res.end('{}'); }
  });
  const first = await f.start({ monitorEnabled: true, backendPollIntervalMs: 50 });
  await until(() => resultAttempts > 0);
  assert.equal(first.instance.status().devices[0].telemetry.snrDb, 25);
  await first.request('/api/devices/SIM-SDR-001', 'PUT', { telemetry: { snrDb: 30 } });
  await first.instance.stop();
  acknowledge = true;
  const attempts = resultAttempts;
  const second = await f.start({ monitorEnabled: true, backendPollIntervalMs: 50 });
  await until(() => resultAttempts > attempts);
  assert.equal(second.instance.status().devices[0].telemetry.snrDb, 30, 'Redelivery must not overwrite a later edit');
  assert.equal(second.instance.status().devices[0].lastCommand.jobId, 'retry-job');
});

test('corrupt inventory fails startup rather than silently replacing persisted devices', async (t) => {
  const f = await fixture(t, (req, res) => res.end('{}'));
  await writeFile(f.config.statePath, '{');
  assert.throws(() => inventoryStore(f.config.statePath, [{ id: 'SIM-SDR-001' }]));
});
