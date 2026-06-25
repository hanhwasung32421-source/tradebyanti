import { z } from 'zod'
import { getDbUser, createDbUser, ensureDbBalanceExists } from '../../utils/db'
import { createSession, hashPassword } from '../../utils/auth'
import { logAppUser, logLogin } from '../../utils/supa-log'

const BodySchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(4).max(50)
})

export default defineEventHandler(async (event) => {
  const body = BodySchema.parse(await readBody(event))

  const exists = await getDbUser(body.username)
  if (exists?.id) {
    throw createError({ statusCode: 409, statusMessage: '이미 사용 중인 아이디입니다.' })
  }

  const passwordHash = hashPassword(body.password)
  const user = await createDbUser(body.username, passwordHash, 'user', JSON.stringify({}))
  await ensureDbBalanceExists(user.id)

  await createSession(event, user.id)
  await logAppUser({ id: user.id, username: body.username, role: 'user' })
  await logLogin(event, { userId: user.id, username: body.username, area: 'main', success: true })
  return { ok: true }
})
