import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { getDb } from '../../utils/db'

const BodySchema = z.object({
  tradeId: z.number().int().positive(),
  title: z.string().min(1).max(50),
  note: z.string().max(200).optional()
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  const trade = db
    .prepare('SELECT id FROM trades WHERE id = ? AND user_id = ?')
    .get(body.tradeId, user.id) as { id: number } | undefined
  if (!trade) throw createError({ statusCode: 404, statusMessage: '거래를 찾을 수 없습니다.' })

  db.prepare('INSERT INTO profit_cards (user_id, trade_id, title, note, created_at) VALUES (?, ?, ?, ?, ?)').run(
    user.id,
    body.tradeId,
    body.title,
    body.note || '',
    new Date().toISOString()
  )

  return { ok: true }
})

