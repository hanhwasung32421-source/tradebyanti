import { z } from 'zod'
import { requireAdmin } from '../../../utils/auth'
import { getDb } from '../../../utils/db'

const BodySchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number().nonnegative() // 잔고는 0 이상
})

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  if (admin.role === 'branch_admin' && !admin.permissions?.canCredit) {
    throw createError({ statusCode: 403, statusMessage: '이 계정에는 입금/잔고 수정 권한이 없습니다.' })
  }

  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(body.userId, 0)
  db.prepare('UPDATE balances SET usdt = ? WHERE user_id = ?').run(body.amount, body.userId)

  return { ok: true }
})
