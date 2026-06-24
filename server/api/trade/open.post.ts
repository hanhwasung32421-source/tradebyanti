import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { getOkxLastPrice } from '../../utils/okx'
import { logBuy } from '../../utils/supa-log'

const BodySchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(['long', 'short']),
  margin: z.number().positive(),
  leverage: z.number().int().min(1).max(100),
  // 지정가(데모): 바로 체결된 것으로 처리
  price: z.number().positive().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(user.id, 0)
  const bal = db.prepare('SELECT usdt FROM balances WHERE user_id = ?').get(user.id) as { usdt: number }

  const entry = body.price ?? (await getOkxLastPrice(body.symbol)).last
  const qty = (body.margin * body.leverage) / entry
  const fee = body.margin * body.leverage * 0.0004

  if (bal.usdt < body.margin + fee) {
    throw createError({ statusCode: 400, statusMessage: '잔고가 부족합니다 (수수료 포함).' })
  }

  db.prepare('UPDATE balances SET usdt = usdt - ? WHERE user_id = ?').run(body.margin + fee, user.id)
  db.prepare(
    'INSERT INTO positions (user_id, symbol, side, qty, entry_price, leverage, margin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(user.id, body.symbol.toUpperCase(), body.side, qty, entry, body.leverage, body.margin, new Date().toISOString())

  db.prepare(
    'INSERT INTO executions (user_id, symbol, side, price, qty, fee, pnl, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    user.id,
    body.symbol.toUpperCase(),
    body.side === 'long' ? 'BUY' : 'SELL',
    entry,
    qty,
    fee,
    0.0,
    new Date().toISOString()
  )

  await logBuy({
    userId: user.id,
    symbol: body.symbol.toUpperCase(),
    side: body.side,
    buy_price: entry,
    qty,
    margin: body.margin,
    leverage: body.leverage
  })

  return { ok: true, entryPrice: entry, qty }
})
