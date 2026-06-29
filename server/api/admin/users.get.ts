import { requireAdmin } from '../../utils/auth'
import { getUsersAndBalances } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  try {
    const rows = await getUsersAndBalances()
    return { users: rows }
  } catch (error: any) {
    console.error('getUsersAndBalances Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `DB 에러 발생: ${error.message || error.details || '알 수 없는 에러'}. SQL 적용을 확인해주세요.`
    })
  }
})
