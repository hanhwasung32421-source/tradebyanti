import { requireUser } from '../../utils/auth'
import { updateHeartbeat } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await updateHeartbeat(user.id)
  return { ok: true }
})
