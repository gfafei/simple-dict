import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'stardict.db');
const DB_PATH = process.env.DICT_DB_PATH || DEFAULT_DB_PATH;

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function ensureSchema() {
  db.exec(`
    DROP TRIGGER IF EXISTS stardict_ai;
    DROP TRIGGER IF EXISTS stardict_ad;
    DROP TRIGGER IF EXISTS stardict_au;
    DROP TABLE IF EXISTS stardict_fts;

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY,
      word TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY,
      word TEXT NOT NULL,
      searched_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
