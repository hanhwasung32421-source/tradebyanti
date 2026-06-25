import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import os from 'node:os'
import bcrypt from 'bcryptjs'

let _db: DatabaseSync | null = null

function nowIso() {
  return new Date().toISOString()
}

export function getDb() {
  if (_db) return _db

  // 배포 환경(서버리스 등) 및 프로젝트 폴더 업데이트 대응을 위한 경로 설정
  // 우선순위: 
  // 1. SQLITE_DIR 환경변수 (컨테이너 볼륨 바인딩 시 사용)
  // 2. 사용자 홈 디렉토리 (~/.exchange-demo-data) - 프로젝트 폴더가 삭제/재배포되어도 데이터 유지
  // 3. 프로젝트 폴더 내부 (data/)
  // 4. OS 임시 폴더
  let dataDir = process.env.SQLITE_DIR
  if (!dataDir) {
    try {
      dataDir = join(os.homedir(), '.exchange-demo-data')
      mkdirSync(dataDir, { recursive: true })
    } catch {
      try {
        dataDir = join(process.cwd(), 'data')
        mkdirSync(dataDir, { recursive: true })
      } catch {
        dataDir = join(os.tmpdir(), 'exchange-demo-data')
        mkdirSync(dataDir, { recursive: true })
      }
    }
  } else {
    try {
      mkdirSync(dataDir, { recursive: true })
    } catch {
      try {
        dataDir = join(os.homedir(), '.exchange-demo-data')
        mkdirSync(dataDir, { recursive: true })
      } catch {
        dataDir = join(os.tmpdir(), 'exchange-demo-data')
        mkdirSync(dataDir, { recursive: true })
      }
    }
  }

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

    CREATE TABLE IF NOT EXISTS executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      price REAL NOT NULL,
      qty REAL NOT NULL,
      fee REAL NOT NULL,
      pnl REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  // 총관리자 기본 계정 생성: admin / 1053
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as
    | { id?: number }
    | undefined

  const passwordHash = bcrypt.hashSync('1053', 10)
  if (!existing?.id) {
    db.prepare(
      'INSERT INTO users (username, password_hash, role, permissions, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run('admin', passwordHash, 'super_admin', JSON.stringify({ all: true, canCredit: true }), nowIso())

    const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: number }
    db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(admin.id, 0)
  } else {
    // 기존 admin 계정이 있으면 암호를 1053으로 강제 동기화하고 롤을 super_admin으로 보장
    db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE username = ?').run(passwordHash, 'super_admin', 'admin')
  }

  // 데모 기본값: 총관리자(admin) USDT를 최소 10000으로 유지
  // (배포 환경에서 SQLite 파일이 초기화되더라도 admin이 항상 거래 가능한 상태가 되도록)
  const seedAdminUsdt = Number(process.env.SEED_ADMIN_USDT ?? '10000')
  if (Number.isFinite(seedAdminUsdt) && seedAdminUsdt > 0) {
    const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: number } | undefined
    if (admin?.id) {
      db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(admin.id, seedAdminUsdt)
      db.prepare('UPDATE balances SET usdt = CASE WHEN usdt < ? THEN ? ELSE usdt END WHERE user_id = ?').run(
        seedAdminUsdt,
        seedAdminUsdt,
        admin.id
      )
    }
  }

  _db = db
  return db
}

export function isoPlusDays(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString()
}
