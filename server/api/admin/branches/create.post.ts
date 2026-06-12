import { z } from 'zod'
import { requireSuperAdmin, hashPassword } from '../../../utils/auth'
import { getDb } from '../../../utils/db'

const BodySchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(4).max(50),
  permissions: z
    .object({
      canCredit: z.boolean().optional(),
      canViewUsers: z.boolean().optional()
    })
    .optional()
})

export default defineEventHandler(async (event) => {
  requireSuperAdmin(event)
  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(body.username) as
    | { id: number }
    | undefined
  if (exists?.id) {
    throw createError({ statusCode: 409, statusMessage: '이미 사용 중인 아이디입니다.' })
  }

  db.prepare(
    'INSERT INTO users (username, password_hash, role, permissions, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(
    body.username,
    hashPassword(body.password),
    'branch_admin',
    JSON.stringify(body.permissions || { canViewUsers: true, canCredit: false }),
    new Date().toISOString()
  )

  const u = db.prepare('SELECT id FROM users WHERE username = ?').get(body.username) as { id: number }
  db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(u.id, 0)

  return { ok: true }
})

