# simple-dict

A local English-Chinese dictionary app, built on the [ECDICT](https://github.com/skywind3000/ECDICT) dataset.

## Stack

- **Data**: [ECDICT](https://github.com/skywind3000/ECDICT) (`stardict.db`, ~760k entries), used directly as the app's database — we add our own `favorites`/`history` tables straight onto that file
- **Backend**: Node.js + Express + better-sqlite3
- **Frontend**: React + Vite + Material UI

## Features

- Prefix word search (type "appl" to find "apple")
- Favorites / bookmarks
- Search history
- Audio pronunciation playback

## Project layout

```
simple-dict/
  server/     Express API + better-sqlite3 (LIKE-based search, favorites, history)
  client/     React + Vite + MUI frontend
```

## Getting started

1. Install dependencies (root install covers both workspaces):

   ```
   npm install
   ```

2. Download the dictionary data. Go to the [ECDICT releases page](https://github.com/skywind3000/ECDICT/releases) and download the **`ecdict-sqlite-XX.zip`** asset (XX = latest version number; described there as "sqlite 有音标"). Unzip it — you'll get a `stardict.db` file (~1GB uncompressed). This is not committed to the repo (too large, and it's not source code), so every environment running this app needs to fetch it separately.

3. Point the server at that file via `server/.env` (copy `server/.env.example` if starting fresh):

   ```
   DICT_DB_PATH=C:\path\to\stardict.db
   ```

   If `DICT_DB_PATH` is unset, the server falls back to `server/data/stardict.db`.

4. Run the backend and frontend (in separate terminals):

   ```
   npm run dev:server
   npm run dev:client
   ```

   The client dev server proxies `/api` requests to `http://localhost:3001`.

## Database schema

The database is the ECDICT `stardict.db` file itself. The `stardict` table comes from ECDICT as-is:

```sql
CREATE TABLE "stardict" (
  "id"          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
  "word"        VARCHAR(64) COLLATE NOCASE NOT NULL UNIQUE,  -- headword
  "sw"          VARCHAR(64) COLLATE NOCASE NOT NULL,          -- normalized word (unused by this app)
  "phonetic"    VARCHAR(64),                                  -- IPA pronunciation
  "definition"  TEXT,                                         -- English definition
  "translation" TEXT,                                         -- Chinese translation
  "pos"         VARCHAR(16),                                  -- part-of-speech frequency ratios
  "collins"     INTEGER DEFAULT(0),                            -- Collins star rating (1-5)
  "oxford"      INTEGER DEFAULT(0),                            -- 1 if an Oxford 3000 word
  "tag"         VARCHAR(64),                                  -- exam wordlists, e.g. "zk gk cet4 cet6"
  "bnc"         INTEGER DEFAULT(NULL),                         -- British National Corpus frequency rank
  "frq"         INTEGER DEFAULT(NULL),                         -- frequency rank
  "exchange"    TEXT,                                         -- inflections (plural, tense, etc.)
  "detail"      TEXT,                                         -- extra JSON detail (sparse)
  "audio"       TEXT                                          -- pronunciation audio ref (unpopulated upstream)
);
-- indexes on id, word, and (sw, word collate nocase)
```

This app adds the following on top, defined in `server/src/db.js` and created automatically on server start:

```sql
CREATE TABLE favorites (
  id INTEGER PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE history (
  id INTEGER PRIMARY KEY,
  word TEXT NOT NULL,
  searched_at TEXT DEFAULT (datetime('now'))
);
```

`favorites` and `history` reference words by the `word` text rather than a foreign key to `stardict.id`, so they stay meaningful even if `stardict` rows are ever reloaded/replaced.

## Notes

- Search is a plain `word LIKE 'prefix%'` query, ordered so an exact match comes first, then shorter/closer matches. It reuses ECDICT's existing `word` index (`sd_1`), so no extra index or setup step is needed. (An earlier FTS5/bm25-based version was replaced because relevance ranking buried exact matches below rare compound headwords — e.g. searching "apple" ranked the word `apple` #923 out of 982 matches, behind oddities like `appleshares`.)
- Since the app writes its own tables (`favorites`, `history`) directly into `stardict.db`, treat that file as app-owned once you start using it — replacing it with a fresh download will also wipe your favorites/history.
- ECDICT's `audio` field is largely unpopulated upstream, so pronunciation playback uses the browser's built-in `SpeechSynthesis` API instead of dictionary audio files.
- `better-sqlite3` is a native module; `npm install` should fetch a prebuilt binary for common platforms/Node versions. If it fails to install, you'll need Visual Studio Build Tools (Windows) to compile it.
- Node's built-in `node:sqlite` (no native dependency) was ruled out originally because it lacks FTS5 by default. Now that search is `LIKE`-based instead of FTS5, that objection no longer applies — `node:sqlite`'s `DatabaseSync` API would cover everything this app needs. It requires Node ≥22.5 (experimental), reaching Release Candidate at v25.7 and stable at v26; this project currently targets Node 20, so switching would mean bumping the Node version first. Worth revisiting later if avoiding the native `better-sqlite3` dependency becomes valuable.

## Deploying / running on a new machine

Things that don't carry over automatically when moving this app to another machine (or setting it up fresh):

- **The dictionary data isn't in the repo.** Download `stardict.db` per the "Getting started" steps above on every machine that runs the server, and point `DICT_DB_PATH` at it.
- **`better-sqlite3` is a native module**, compiled per OS/architecture/Node version. `npm install` fetches a prebuilt binary for common combinations, but if you copy `node_modules` between machines (instead of running `npm install` fresh on each one) it likely won't work — reinstall/rebuild on the target machine.
- **No production build/serving is wired up yet.** `npm run dev:client` and `npm run dev:server` are dev-only (Vite dev server + Express, connected via a dev-time proxy). There's no step that serves a built `client/dist` from the Express server or otherwise puts both behind one origin — that would need to be added before this could run outside of local development.
- **No authentication, and `cors()` currently allows any origin.** That's fine as designed — this is a local single-user tool — but don't expose the server's port beyond localhost without adding auth first.
- **Disk space**: `stardict.db` plus its `-wal`/`-shm` files run to roughly 1GB+. Make sure the target machine has room.
- **Back up `stardict.db` if your favorites/history matter** — as noted above, the app writes directly into that file, so it's not safe to casually delete/replace once you've started using it.

## Status

Scaffolded — backend routes and a basic search UI exist; not yet run end-to-end.
