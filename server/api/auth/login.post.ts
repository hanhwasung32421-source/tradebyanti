import { z } from 'zod'
import { getDbUser, isIpBlocked, updateUserLoginStatus } from '../../utils/db'
import { createSession, verifyPassword } from '../../utils/auth'
import { logLogin } from '../../utils/supa-log'
import { getRequestIP } from 'h3'

const BodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event) || '0.0.0.0'
  
  // 1. IP 차단 확인
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
      statusMessage: '아이디와 비밀번호를 입력해주세요.'
    })
  }
  const body = parsed.data

  const user = await getDbUser(body.username)

  if (!user || !verifyPassword(body.password, user.password_hash)) {
    await logLogin(event, { userId: user?.id ?? null, username: body.username, area: 'main', success: false })
    throw createError({ statusCode: 401, statusMessage: '아이디 또는 비밀번호가 올바르지 않습니다.' })
  }

  // 로그인 성공 시 세션 생성 및 유저 상태(접속시간, IP) 업데이트
  await createSession(event, user.id)
  await updateUserLoginStatus(user.id, ip)
  await logLogin(event, { userId: user.id, username: body.username, area: 'main', success: true })
  
  return { ok: true }
})
