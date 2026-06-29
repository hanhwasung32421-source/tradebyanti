import { z } from 'zod'
import { requireAdmin } from '../../../utils/auth'
import { deleteDbUser } from '../../../utils/db'

const BodySchema = z.object({
  id: z.number()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = BodySchema.parse(await readBody(event))
  
  await deleteDbUser(body.id)
  
  return { ok: true }
})
