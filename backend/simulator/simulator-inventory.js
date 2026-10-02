import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const MODES = ['auto', 'online', 'warning', 'updating', 'disconnected'];
export const FAULTS = ['normal', 'network_loss', 'timeout'];

export function normalizeDevice(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Device must be an object');
  if (typeof input.id !== 'string' || !/^SIM-SDR-[A-Za-z0-9._:-]{1,56}$/.test(input.id)) {
    throw new Error('Simulator IDs must start with SIM-SDR- and contain at most 64 safe characters');
  }
  function text(value, fallback, name) {
    const result = value ?? fallback;
    if (typeof result !== 'string' || result.length > 100 || !result.trim()) throw new Error(`${name} must contain 1–100 characters`);
    return result.trim();
  }
  const mode = input.mode ?? 'auto';
  if (!MODES.includes(mode)) throw new Error('Invalid simulation mode');
  const metadata = input.metadata ?? {};
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('metadata must be an object');
  const telemetry = input.telemetry ?? {};
  if (!telemetry || typeof telemetry !== 'object' || Array.isArray(telemetry)) throw new Error('telemetry must be an object');
  const normalizedTelemetry = {};
  for (const [key, min, max] of [['throughputMbps', 0, 100000], ['snrDb', -200, 200]]) {
    const value = telemetry[key];
    if (value === undefined || value === null) continue;
    if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${key} must be between ${min} and ${max}`);
    normalizedTelemetry[key] = value;
  }
  const fault = input.fault ?? 'normal';
  if (!FAULTS.includes(fault)) throw new Error('Invalid transport scenario');
  return {
    id: input.id, displayName: text(input.displayName, input.id, 'displayName'), mode,
    metadata: Object.fromEntries(['model', 'location'].filter((key) => metadata[key] !== undefined && metadata[key] !== '').map((key) => [key, text(metadata[key], '', key)])),
    telemetry: normalizedTelemetry, fault,
  };
}

export function inventoryStore(path, initial) {
  let state = { version: 1, devices: initial.map(normalizeDevice), executions: {} };
  if (path && existsSync(path)) {
    const saved = JSON.parse(readFileSync(path, 'utf8'));
    if (saved.version !== 1 || !Array.isArray(saved.devices) || !saved.executions || typeof saved.executions !== 'object' || Array.isArray(saved.executions)) throw new Error('Invalid simulator state file');
    state = { ...saved, devices: saved.devices.map(normalizeDevice) };
  }
  validate(state.devices);
  function validate(devices) {
    if (devices.length > 100 || new Set(devices.map((d) => d.id)).size !== devices.length) throw new Error('Inventory must have unique IDs and at most 100 devices');
  }
  return {
    get state() { return state; },
    save(devices, executions = state.executions) {
      const normalized = devices.map(normalizeDevice);
      validate(normalized);
      const next = { version: 1, devices: normalized, executions };
      if (path) {
        mkdirSync(dirname(path), { recursive: true });
        const temporary = `${path}.tmp`;
        writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
        renameSync(temporary, path);
      }
      state = next;
    },
  };
}
