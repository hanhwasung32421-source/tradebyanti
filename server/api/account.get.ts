import { requireUser } from '../utils/auth'
import { getDb } from '../utils/db'

export default defineEventHandler((event) => {
  const user = requireUser(event)
  const db = getDb()

  const bal = db.prepare('SELECT usdt FROM balances WHERE user_id = ?').get(user.id) as { usdt: number } | undefined
  const positions = db
    .prepare('SELECT * FROM positions WHERE user_id = ? ORDER BY id DESC')
    .all(user.id) as any[]
  const trades = db
    .prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY id DESC LIMIT 50')
    .all(user.id) as any[]
  const cards = db
    .prepare(
      `SELECT pc.id, pc.title, pc.note, pc.created_at, t.symbol, t.side, t.qty, t.pnl, t.entry_price, t.exit_price
       FROM profit_cards pc
       JOIN trades t ON t.id = pc.trade_id
       WHERE pc.user_id = ?
       ORDER BY pc.id DESC
       LIMIT 50`
    )
    .all(user.id) as any[]

  return {
    me: user,
    balance: { usdt: bal?.usdt ?? 0 },
    positions,
    trades,
    cards
  }
})

