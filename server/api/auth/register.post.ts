import { z } from 'zod'
import { getDbUser, createDbUser, ensureDbBalanceExists, isIpBlocked, updateUserLoginStatus } from '../../utils/db'
import { createSession, hashPassword } from '../../utils/auth'
import { logAppUser, logLogin } from '../../utils/supa-log'
import { getRequestIP } from 'h3'

const BodySchema = z.object({
  username: z.string().min(2).max(20),
  password: z.string().min(4).max(50),
  real_name: z.string().min(1, '이름을 입력해주세요.').optional(),
  phone: z.string().min(1, '전화번호를 입력해주세요.').optional(),
  birthdate: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event) || '0.0.0.0'
  
  // 1. IP 차단 확인 (차단된 IP는 가입 불가)
  const blocked = await isIpBlocked(ip)
  if (blocked) {
    throw createError({
      statusCode: 403,
      statusMessage: '접속이 차단된 IP입니다.'
    })
  }

  const parsed = BodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '입력된 정보가 올바르지 않습니다. 모든 필수 항목을 확인해주세요.'
    })
  }
  const body = parsed.data

  const exists = await getDbUser(body.username)
  if (exists?.id) {
    throw createError({ statusCode: 409, statusMessage: '이미 사용 중인 아이디입니다.' })
  }

  const passwordHash = hashPassword(body.password)
  const user = await createDbUser(body.username, passwordHash, 'user', JSON.stringify({}), {
    real_name: body.real_name,
    phone: body.phone,
    birthdate: body.birthdate,
    bank_name: body.bank_name,
    bank_account: body.bank_account
  })
  await ensureDbBalanceExists(user.id)

  await createSession(event, user.id)
  await updateUserLoginStatus(user.id, ip)
  await logAppUser({ id: user.id, username: body.username, role: 'user' })
  await logLogin(event, { userId: user.id, username: body.username, area: 'main', success: true })
  
  return { ok: true }
})
