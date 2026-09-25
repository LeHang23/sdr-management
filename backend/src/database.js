import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const databaseDirectory = resolve(currentDirectory, '../database');
const schemaPath = resolve(databaseDirectory, 'schema.sql');
const seedPath = resolve(databaseDirectory, 'seed.sql');

export function openDatabase(databasePath) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec('PRAGMA foreign_keys = ON;');
  database.exec('PRAGMA journal_mode = WAL;');
  return database;
}

export function migrateDatabase(database) {
  database.exec(readFileSync(schemaPath, 'utf8'));
}

export function seedDatabase(database) {
  database.exec(readFileSync(seedPath, 'utf8'));
  seedTelemetry(database);
}

function seedTelemetry(database) {
  const existingSamples = Number(database.prepare('SELECT COUNT(*) AS value FROM device_telemetry').get().value);
  if (existingSamples > 0) return;

  const anchor = new Date();
  anchor.setUTCSeconds(0, 0);
  anchor.setUTCMinutes(Math.floor(anchor.getUTCMinutes() / 5) * 5);
  const devices = Array.from(
    { length: 19 },
    (_, index) => `SDR-${String(index + 1).padStart(3, '0')}`,
  );
  const insert = database.prepare(`
    INSERT OR IGNORE INTO device_telemetry (
      device_id,
      sampled_at,
      source,
      throughput_mbps,
      snr_db
    ) VALUES (?, ?, 'manual', ?, ?)
  `);

  database.exec('BEGIN IMMEDIATE;');
  try {
    for (let step = 0; step <= 288; step += 1) {
      const sampledAt = new Date(anchor.getTime() - (288 - step) * 5 * 60_000).toISOString();
      devices.forEach((deviceId, deviceIndex) => {
        const throughputMbps = Number((
          48 + deviceIndex * 0.35 + Math.sin(step / 9) * 7 + Math.cos((step + deviceIndex) / 5) * 2
        ).toFixed(1));
        const snrDb = Number((
          18 + deviceIndex * 0.12 + Math.sin(step / 13 + deviceIndex * 0.12) * 2
        ).toFixed(1));
        insert.run(deviceId, sampledAt, throughputMbps, snrDb);
      });
    }
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
}

export function readSnapshot(database, read) {
  database.exec('BEGIN;');
  try {
    const result = read();
    database.exec('COMMIT;');
    return result;
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
}
