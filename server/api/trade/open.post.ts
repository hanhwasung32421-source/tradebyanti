import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { getOkxLastPrice } from '../../utils/okx'

const BodySchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(['long', 'short']),
  margin: z.number().positive(),
  leverage: z.number().int().min(1).max(100)
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(user.id, 0)
  const bal = db.prepare('SELECT usdt FROM balances WHERE user_id = ?').get(user.id) as { usdt: number }

  if (bal.usdt < body.margin) {
    throw createError({ statusCode: 400, statusMessage: '잔고가 부족합니다.' })
  }

  const { last } = await getOkxLastPrice(body.symbol)
  const qty = (body.margin * body.leverage) / last

  db.prepare('UPDATE balances SET usdt = usdt - ? WHERE user_id = ?').run(body.margin, user.id)
  db.prepare(
    'INSERT INTO positions (user_id, symbol, side, qty, entry_price, leverage, margin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(user.id, body.symbol.toUpperCase(), body.side, qty, last, body.leverage, body.margin, new Date().toISOString())

  return { ok: true, entryPrice: last, qty }
})

