import { requireUser } from '../utils/auth'
import { getDb } from '../utils/db'

export default defineEventHandler((event) => {
  const user = requireUser(event)
  const query = getQuery(event)
  const limit = parseInt((query.limit as string) || '20')
  const offset = parseInt((query.offset as string) || '0')

  const db = getDb()
  const rows = db
    .prepare(
      `SELECT * FROM executions
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT ? OFFSET ?`
    )
    .all(user.id, limit, offset) as any[]

  return { executions: rows }
})
