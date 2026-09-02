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
