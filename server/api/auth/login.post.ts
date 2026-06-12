import { z } from 'zod'
import { getDb } from '../../utils/db'
import { createSession, verifyPassword } from '../../utils/auth'
import { logLogin } from '../../utils/supa-log'

const BodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const body = BodySchema.parse(await readBody(event))
  const db = getDb()

  const user = db
    .prepare('SELECT id, password_hash FROM users WHERE username = ?')
    .get(body.username) as { id: number; password_hash: string } | undefined

  if (!user || !verifyPassword(body.password, user.password_hash)) {
    await logLogin(event, { userId: user?.id ?? null, username: body.username, area: 'main', success: false })
    throw createError({ statusCode: 401, statusMessage: '아이디 또는 비밀번호가 올바르지 않습니다.' })
  }

  createSession(event, user.id)
  await logLogin(event, { userId: user.id, username: body.username, area: 'main', success: true })
  return { ok: true }
})
