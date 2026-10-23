import { Database } from "bun:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.CADERNO_DB_PATH ?? "data/caderno.sqlite";
const SCHEMA_PATH = new URL("./schema.sql", import.meta.url);

let db: Database | undefined;

export function getDb(): Database {
  if (db) return db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(readFileSync(SCHEMA_PATH, "utf-8"));

  return db;
}
