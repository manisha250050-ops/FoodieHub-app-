import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const databaseDir = path.resolve(process.cwd(), 'database');
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const dbPath = path.join(databaseDir, 'foodiehub.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initializeDatabase(): void {
  const schemaPath = path.join(databaseDir, 'schema.sql');
  const seedPath = path.join(databaseDir, 'seed.sql');

  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  const row = db.prepare('SELECT COUNT(*) AS count FROM Categories').get() as { count: number };
  if (row.count === 0) {
    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    db.exec(seedSql);
  }
}

export default db;
