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

2. Point the server at your ECDICT SQLite build via `server/.env` (copy `server/.env.example` if starting fresh):

   ```
   DICT_DB_PATH=C:\path\to\stardict.db
   ```

   If `DICT_DB_PATH` is unset, the server falls back to `server/data/stardict.db`.

3. Run the backend and frontend (in separate terminals):

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

## Status

Scaffolded — backend routes and a basic search UI exist; not yet run end-to-end.
