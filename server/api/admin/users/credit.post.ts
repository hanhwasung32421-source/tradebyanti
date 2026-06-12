import { z } from 'zod'
import { requireAdmin } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { logAdminCredit } from '../../../utils/supa-log'

const BodySchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number().positive()
})

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  if (admin.role === 'branch_admin' && !admin.permissions?.canCredit) {
    throw createError({ statusCode: 403, statusMessage: '이 계정에는 입금 권한이 없습니다.' })
  }

  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(body.userId, 0)
  db.prepare('UPDATE balances SET usdt = usdt + ? WHERE user_id = ?').run(body.amount, body.userId)

  await logAdminCredit({ adminUserId: admin.id, userId: body.userId, amount: body.amount })
  return { ok: true }
})
