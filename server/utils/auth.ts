import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getCookie, setCookie, deleteCookie, H3Event } from 'h3'
import { getDb, isoPlusDays } from './db'

const COOKIE_NAME = 'session_token'

export type Role = 'user' | 'super_admin' | 'branch_admin'

export type SessionUser = {
  id: number
  username: string
  role: Role
  permissions: Record<string, any>
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash)
}

export function createSession(event: H3Event, userId: number) {
  const db = getDb()
  const token = randomBytes(24).toString('hex')
  const createdAt = new Date().toISOString()
  const expiresAt = isoPlusDays(7)
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    createdAt,
    expiresAt
  )

  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt)
  })
}

export function clearAuthSession(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME)
  const db = getDb()
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  }
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function getSessionUser(event: H3Event): SessionUser | null {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return null

  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT u.id, u.username, u.role, u.permissions
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ?
      `
    )
    .get(token) as { id: number; username: string; role: Role; permissions: string } | undefined

  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    permissions: JSON.parse(row.permissions || '{}')
  }
}

export function requireUser(event: H3Event) {
  const user = getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다.' })
  }
  return user
}

export function requireAdmin(event: H3Event) {
  const user = requireUser(event)
  if (user.role !== 'super_admin' && user.role !== 'branch_admin') {
    throw createError({ statusCode: 403, statusMessage: '관리자 권한이 필요합니다.' })
  }
  return user
}

export function requireSuperAdmin(event: H3Event) {
  const user = requireAdmin(event)
  if (user.role !== 'super_admin') {
    throw createError({ statusCode: 403, statusMessage: '총관리자 권한이 필요합니다.' })
  }
  return user
}
