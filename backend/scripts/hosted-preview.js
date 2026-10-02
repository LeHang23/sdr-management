import { createServer, request as proxyRequest } from 'node:http';
import { createServer as reservePort } from 'node:net';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createSimulator } from '../simulator/simulator-runtime.js';
import { integerSetting, readSimulatorConfig } from '../simulator/simulator-config.js';
import { previewAuth } from '../src/preview-auth.js';

const root = fileURLToPath(new URL('../..', import.meta.url));
let dashboard;
let simulator;
let publicServer;
let shuttingDown;

async function stop() {
  if (shuttingDown) return shuttingDown;
  shuttingDown = (async () => {
    if (publicServer?.listening) {
      await new Promise((resolve) => {
        publicServer.close(resolve);
        publicServer.closeAllConnections();
      });
    }
    await simulator?.stop();
    if (dashboard && dashboard.exitCode === null && dashboard.signalCode === null) {
      const closed = new Promise((resolve) => dashboard.once('close', resolve));
      dashboard.kill('SIGTERM');
      const timer = setTimeout(() => dashboard.kill('SIGKILL'), 2000);
      await closed;
      clearTimeout(timer);
    }
  })();
  return shuttingDown;
}

process.once('SIGINT', () => { void stop(); });
process.once('SIGTERM', () => { void stop(); });

try {
  if (!process.env.SDR_PREVIEW_PASSWORD) throw new Error('SDR_PREVIEW_PASSWORD is required for hosted preview.');
  const username = process.env.SDR_PREVIEW_USER ?? 'admin';
  previewAuth(username, process.env.SDR_PREVIEW_PASSWORD, 'SDR preview');
  const port = integerSetting(process.env, 'PORT', 4173, 1, 65_535);
  const host = process.env.HOST ?? '127.0.0.1';
  const publicUrl = process.env.SDR_DASHBOARD_PUBLIC_URL ?? `http://127.0.0.1:${port}`;
  const gatewayToken = process.env.SDR_GATEWAY_TOKEN ?? randomBytes(32).toString('hex');
  const reservation = reservePort();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const internalPort = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const config = readSimulatorConfig({
    ...process.env,
    SDR_GATEWAY_TOKEN: gatewayToken,
    SDR_SERVER_URL: `http://127.0.0.1:${internalPort}`,
    SDR_DASHBOARD_PUBLIC_URL: publicUrl,
    SDR_SIMULATOR_CONSOLE_USER: username,
    SDR_SIMULATOR_CONSOLE_PASSWORD: process.env.SDR_PREVIEW_PASSWORD,
    SDR_SIMULATOR_INTERVAL_MS: process.env.SDR_SIMULATOR_INTERVAL_MS ?? '5000',
    SDR_SIMULATOR_REQUEST_TIMEOUT_MS: process.env.SDR_SIMULATOR_REQUEST_TIMEOUT_MS ?? '2000',
    SDR_SIMULATOR_CONTROL_HOST: '127.0.0.1',
    SDR_SIMULATOR_STATE_PATH: process.env.SDR_SIMULATOR_STATE_PATH ?? fileURLToPath(new URL('../data/simulator-state.json', import.meta.url)),
  }, []);
  dashboard = spawn(process.execPath, ['backend/src/server.js'], {
    cwd: root,
    env: {
      ...process.env,
      HOST: '127.0.0.1', PORT: String(internalPort), SDR_GATEWAY_TOKEN: gatewayToken,
      SDR_PREVIEW_USER: username, SDR_PREVIEW_PASSWORD: process.env.SDR_PREVIEW_PASSWORD,
      SDR_DATABASE_PATH: process.env.SDR_DATABASE_PATH ?? fileURLToPath(new URL('../data/hosted-preview.db', import.meta.url)),
      SDR_SEED_DEMO: 'false', SDR_HEARTBEAT_TIMEOUT_MS: String(config.intervalMs * 3),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  dashboard.on('error', () => {});
  dashboard.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`Dashboard stopped (code ${code}); closing hosted preview.`);
      process.exitCode = 1;
      void stop();
    }
  });
  await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => finish(new Error('Dashboard did not start within 10 seconds')), 10_000);
    function finish(error) {
      clearTimeout(timer);
      dashboard.stdout.off('data', onData);
      dashboard.off('error', onError);
      dashboard.off('exit', onExit);
      error ? reject(error) : resolve();
    }
    function onData(data) {
      output += data;
      if (output.includes('SDR Management running')) finish();
    }
    function onError(error) { finish(error); }
    function onExit() { finish(new Error('Dashboard failed to start')); }
    dashboard.stdout.on('data', onData);
    dashboard.stderr.pipe(process.stderr);
    dashboard.once('error', onError);
    dashboard.once('exit', onExit);
  });
  if (shuttingDown) throw new Error('Hosted startup cancelled');
  simulator = createSimulator({ ...config, controlPort: 0 });
  await simulator.start();
  const simulatorPort = simulator.controlServer.address().port;
  publicServer = createServer((request, response) => {
    let pathname;
    try { pathname = new URL(request.url, 'http://preview').pathname; } catch {
      response.writeHead(400); response.end('Invalid request'); return;
    }
    if (pathname === '/health' && request.method === 'GET') {
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end('{"status":"ok"}');
      return;
    }
    if (pathname === '/simulator') {
      response.writeHead(308, { Location: '/simulator/' }); response.end(); return;
    }
    const isConsole = pathname.startsWith('/simulator/');
    const upstream = proxyRequest({
      hostname: '127.0.0.1', port: isConsole ? simulatorPort : internalPort,
      path: isConsole ? request.url.slice('/simulator'.length) : request.url,
      method: request.method, headers: request.headers,
    }, (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    });
    upstream.setTimeout(15_000, () => upstream.destroy(new Error('Upstream timeout')));
    upstream.on('error', () => {
      if (!response.headersSent) response.writeHead(502);
      response.end('Preview service unavailable');
    });
    request.on('aborted', () => upstream.destroy());
    request.pipe(upstream);
  });
  await new Promise((resolve, reject) => {
    publicServer.once('error', reject);
    publicServer.listen(port, host, resolve);
  });
  console.log(`Hosted preview ready\nDashboard: ${config.dashboardUrl}/\nSimulator: ${config.dashboardUrl}/simulator/`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
  await stop();
}
