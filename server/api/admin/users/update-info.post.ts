import { z } from 'zod'
import { requireAdmin, hashPassword } from '../../../utils/auth'
import { updateDbUserInfo } from '../../../utils/db'

const BodySchema = z.object({
  id: z.number(),
  password: z.string().optional(),
  real_name: z.string().optional(),
  phone: z.string().optional(),
  birthdate: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = BodySchema.parse(await readBody(event))
  
  const payload: any = {
    real_name: body.real_name,
    phone: body.phone,
    birthdate: body.birthdate,
    bank_name: body.bank_name,
    bank_account: body.bank_account
  }
  
  if (body.password) {
    payload.password_hash = hashPassword(body.password)
  }
  
  await updateDbUserInfo(body.id, payload)
  return { ok: true }
})
