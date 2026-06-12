import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import bcrypt from 'bcryptjs'

let _db: DatabaseSync | null = null

function nowIso() {
  return new Date().toISOString()
}

export function getDb() {
  if (_db) return _db

  const dataDir = join(process.cwd(), 'data')
  mkdirSync(dataDir, { recursive: true })

  const dbPath = join(dataDir, 'app.db')
  mkdirSync(dirname(dbPath), { recursive: true })

  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode=WAL;')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS balances (
      user_id INTEGER PRIMARY KEY,
      usdt REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      qty REAL NOT NULL,
      entry_price REAL NOT NULL,
      leverage INTEGER NOT NULL,
      margin REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      qty REAL NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL NOT NULL,
      leverage INTEGER NOT NULL,
      pnl REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profit_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      trade_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `)

  // 총관리자 기본 계정 생성: admin / 1121
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as
    | { id?: number }
    | undefined

  if (!existing?.id) {
    const passwordHash = bcrypt.hashSync('1121', 10)
    db.prepare(
      'INSERT INTO users (username, password_hash, role, permissions, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run('admin', passwordHash, 'super_admin', JSON.stringify({ all: true, canCredit: true }), nowIso())

    const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: number }
    db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(admin.id, 0)
  }

  _db = db
  return db
}

export function isoPlusDays(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString()
}

