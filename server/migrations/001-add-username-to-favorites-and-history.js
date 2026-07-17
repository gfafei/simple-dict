// Recreate favorites/history with per-user scoping.
//
// Background: favorites/history were originally single-user, so existing
// databases have these tables without a `username` column. Multi-user
// support (src/users.js, src/middleware/requireUser.js) scopes every
// read/write by username, so older databases need this column added
// before the app will work against them again.
//
// WARNING: both tables are dropped and recreated from scratch below,
// discarding any existing rows. This app is early enough that existing
// favorites/history data isn't worth preserving/backfilling; back up the
// DB file first if that's no longer true for you.
//
// Run from the server/ directory (needs DICT_DB_PATH from .env):
//   npm run migrate:001
// or directly:
//   node --env-file=.env migrations/001-add-username-to-favorites-and-history.js

import Database from 'better-sqlite3';

const dbPath = process.env.DICT_DB_PATH;
if (!dbPath) {
  console.error('DICT_DB_PATH is not set — run this with `node --env-file=.env ...` (see comments in this file).');
  process.exit(1);
}

const db = new Database(dbPath);

db.exec(`
  DROP TABLE IF EXISTS favorites;
  CREATE TABLE favorites (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    word TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE (username, word)
  );

  DROP TABLE IF EXISTS history;
  CREATE TABLE history (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    word TEXT NOT NULL,
    searched_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log(`Migration applied to ${dbPath}: favorites and history recreated with a username column.`);
