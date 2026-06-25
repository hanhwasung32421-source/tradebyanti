import { z } from 'zod'
import { requireAdmin } from '../../../utils/auth'
import { getDb } from '../../../utils/db'

const BodySchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(['user', 'branch_admin', 'super_admin']),
  permissions: z
    .object({
      canCredit: z.boolean().optional(),
      canViewUsers: z.boolean().optional()
    })
    .optional()
})

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  // 부어드민으로 등업할 때 기본 권한 부여
  const perms = body.permissions || (body.role === 'branch_admin' 
    ? { canViewUsers: true, canCredit: true } 
    : body.role === 'super_admin' 
      ? { all: true, canCredit: true } 
      : {});

  db.prepare('UPDATE users SET role = ?, permissions = ? WHERE id = ?').run(
    body.role,
    JSON.stringify(perms),
    body.userId
  )

  return { ok: true }
})
