import { Database } from "@db/sqlite";

const didCache = new Database("./data/did_cache.db").tap(db => {
  db.exec(`pragma journal_mode = WAL;`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS did (
      did TEXT NOT NULL UNIQUE PRIMARY KEY,
      doc TEXT NOT NULL CHECK (json_valid(doc)),
      fetched_at INTEGER NOT NULL DEFAULT (unixepoch())
    ) STRICT;
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS handle (
      handle TEXT NOT NULL UNIQUE PRIMARY KEY,
      did TEXT NOT NULL,
      fetched_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
});

const articles = new Database("./data/articles.db").tap(db => {
  db.exec(`pragma journal_mode = WAL;`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      at_identifier TEXT NOT NULL,
      rkey TEXT NOT NULL,
      record TEXT NOT NULL CHECK (json_valid(record)),
      fetched_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE (at_identifier, rkey)
    ) STRICT;
  `);
});

export const db = {
  didCache,
  articles,
};
