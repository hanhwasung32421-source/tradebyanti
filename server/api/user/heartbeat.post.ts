import { requireUser } from '../../utils/auth'
import { updateHeartbeat } from '../../utils/db'
import { getRequestIP } from 'h3'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const ip = getRequestIP(event) || '0.0.0.0'
  await updateHeartbeat(user.id, ip)
  return { ok: true }
})
