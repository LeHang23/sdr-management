export function integerSetting(env, name, fallback, minimum, maximum = 2_147_483_647) {
  const value = Number(env[name] ?? fallback);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

export function readSimulatorConfig(env = process.env, argv = process.argv) {
  if (!env.SDR_GATEWAY_TOKEN?.trim()) throw new Error('SDR_GATEWAY_TOKEN is required. Use the same token configured on the backend.');
  const target = new URL(env.SDR_SERVER_URL ?? 'http://127.0.0.1:4173');
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.search || target.hash) {
    throw new Error('SDR_SERVER_URL must be an HTTP(S) URL without credentials, query or fragment.');
  }
  const dashboardUrl = new URL(env.SDR_DASHBOARD_PUBLIC_URL ?? target.href);
  if (!['http:', 'https:'].includes(dashboardUrl.protocol) || dashboardUrl.username || dashboardUrl.password || dashboardUrl.search || dashboardUrl.hash) {
    throw new Error('SDR_DASHBOARD_PUBLIC_URL must be an HTTP(S) URL without credentials, query or fragment.');
  }
  const consolePassword = env.SDR_SIMULATOR_CONSOLE_PASSWORD;
  if (consolePassword !== undefined && consolePassword.trim().length < 12) {
    throw new Error('SDR_SIMULATOR_CONSOLE_PASSWORD must contain at least 12 nonblank characters.');
  }
  const consoleUser = env.SDR_SIMULATOR_CONSOLE_USER ?? 'admin';
  if (!consoleUser.trim() || consoleUser.includes(':')) throw new Error('SDR_SIMULATOR_CONSOLE_USER must be nonempty and contain no colon.');
  return {
    serverUrl: target.href.replace(/\/$/, ''),
    gatewayToken: env.SDR_GATEWAY_TOKEN,
    dashboardUrl: dashboardUrl.href.replace(/\/$/, ''),
    consoleUser,
    consolePassword,
    intervalMs: integerSetting(env, 'SDR_SIMULATOR_INTERVAL_MS', 60_000, 250, 715_827_882),
    requestTimeoutMs: integerSetting(env, 'SDR_SIMULATOR_REQUEST_TIMEOUT_MS', 10_000, 1),
    deviceCount: integerSetting(env, 'SDR_SIMULATOR_DEVICE_COUNT', 4, 1, 100),
    controlHost: env.SDR_SIMULATOR_CONTROL_HOST ?? '127.0.0.1',
    controlPort: integerSetting(env, 'SDR_SIMULATOR_CONTROL_PORT', 4_180, 1, 65_535),
    runOnce: argv.includes('--once'),
  };
}
