import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { getOkxLastPrice } from '../../utils/okx'

const BodySchema = z.object({
  positionId: z.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  const pos = db
    .prepare('SELECT * FROM positions WHERE id = ? AND user_id = ?')
    .get(body.positionId, user.id) as
    | { id: number; symbol: string; side: string; qty: number; entry_price: number; leverage: number; margin: number }
    | undefined

  if (!pos) throw createError({ statusCode: 404, statusMessage: '포지션을 찾을 수 없습니다.' })

  const { last } = await getOkxLastPrice(pos.symbol)
  const exit = last

  const pnlRaw = (exit - pos.entry_price) * pos.qty
  const pnl = pos.side === 'long' ? pnlRaw : -pnlRaw

  // 잔고: 증거금 반환 + 손익 반영 - 수수료 반영
  const fee = pos.qty * exit * 0.0004
  db.prepare('INSERT OR IGNORE INTO balances (user_id, usdt) VALUES (?, ?)').run(user.id, 0)
  db.prepare('UPDATE balances SET usdt = usdt + ? WHERE user_id = ?').run(pos.margin + pnl - fee, user.id)

  db.prepare('DELETE FROM positions WHERE id = ? AND user_id = ?').run(pos.id, user.id)

  db.prepare(
    'INSERT INTO trades (user_id, symbol, side, qty, entry_price, exit_price, leverage, pnl, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    user.id,
    pos.symbol,
    pos.side,
    pos.qty,
    pos.entry_price,
    exit,
    pos.leverage,
    pnl,
    new Date().toISOString()
  )

  db.prepare(
    'INSERT INTO executions (user_id, symbol, side, price, qty, fee, pnl, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    user.id,
    pos.symbol,
    pos.side === 'long' ? 'SELL' : 'BUY',
    exit,
    pos.qty,
    fee,
    pnl,
    new Date().toISOString()
  )

  return {
    ok: true,
    symbol: pos.symbol,
    side: pos.side,
    leverage: pos.leverage,
    qty: pos.qty,
    entryPrice: pos.entry_price,
    exitPrice: exit,
    pnl,
    fee
  }
})

