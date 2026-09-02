import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, migrateDatabase, seedDatabase } from '../src/database.js';

const rootDirectory = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const databasePath = process.env.SDR_DATABASE_PATH ?? resolve(rootDirectory, 'backend/data/sdr-management.db');
const command = process.argv[2];

if (!['init', 'seed'].includes(command)) {
  console.error('Usage: node backend/scripts/database-cli.js <init|seed>');
  process.exitCode = 1;
} else {
  const database = openDatabase(databasePath);
  try {
    migrateDatabase(database);
    if (command === 'seed') {
      seedDatabase(database);
    }
    console.log(`${command === 'seed' ? 'Seeded' : 'Initialized'} SQLite database: ${databasePath}`);
  } finally {
    database.close();
  }
}
