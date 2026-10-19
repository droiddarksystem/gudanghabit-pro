CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  divisi TEXT NOT NULL DEFAULT 'general',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  shift TEXT NOT NULL,
  divisi TEXT NOT NULL,
  habit_id TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, tanggal, shift, divisi, habit_id)
);

CREATE TABLE IF NOT EXISTS aset_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  shift TEXT NOT NULL,
  aset_id TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, tanggal, shift, aset_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  shift TEXT NOT NULL,
  content TEXT DEFAULT '',
  UNIQUE(user_id, tanggal, shift)
);

CREATE TABLE IF NOT EXISTS serah_manual (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  shift TEXT NOT NULL,
  item_id TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, tanggal, shift, item_id)
);

CREATE TABLE IF NOT EXISTS serah_terima (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  shift TEXT NOT NULL,
  divisi TEXT NOT NULL,
  dari_nama TEXT NOT NULL,
  penerima TEXT NOT NULL,
  catatan TEXT DEFAULT '',
  habit_pct INTEGER DEFAULT 0,
  waktu TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  divisi TEXT NOT NULL,
  created_at TEXT NOT NULL
);
