import { z } from 'zod'
import { getDb } from '../../utils/db'
import { createSession, hashPassword } from '../../utils/auth'

const BodySchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(4).max(50)
})

export default defineEventHandler(async (event) => {
  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(body.username) as
    | { id: number }
    | undefined
  if (exists?.id) {
    throw createError({ statusCode: 409, statusMessage: '이미 사용 중인 아이디입니다.' })
  }

  const passwordHash = hashPassword(body.password)
  db.prepare(
    'INSERT INTO users (username, password_hash, role, permissions, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(body.username, passwordHash, 'user', JSON.stringify({}), new Date().toISOString())

  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(body.username) as { id: number }
  db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(user.id, 0)

  createSession(event, user.id)
  return { ok: true }
})

