import { requireAdmin } from '../../utils/auth'
import { getDb } from '../../utils/db'

export default defineEventHandler((event) => {
  requireAdmin(event)
  const db = getDb()

  const rows = db
    .prepare(
      `
      SELECT u.id, u.username, u.role, u.created_at, b.usdt
      FROM users u
      LEFT JOIN balances b ON b.user_id = u.id
      ORDER BY u.id DESC
      `
    )
    .all() as Array<{ id: number; username: string; role: string; created_at: string; usdt: number }>

  return { users: rows }
})

