import { z } from 'zod'
import { requireAdmin } from '../../../utils/auth'
import { blockIp, unblockIp } from '../../../utils/db'

const BodySchema = z.object({
  ip: z.string(),
  block: z.boolean() // true to block, false to unblock
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = BodySchema.parse(await readBody(event))
  
  if (body.block) {
    await blockIp(body.ip, 'Admin blocked via UI')
  } else {
    await unblockIp(body.ip)
  }
  
  return { ok: true }
})
