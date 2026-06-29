import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { getDbBalance, incrementDbBalance, createDbPosition, createDbExecution } from '../../utils/db'
import { getOkxLastPrice } from '../../utils/okx'
import { logBuy } from '../../utils/supa-log'

const BodySchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(['long', 'short']),
  margin: z.number().positive(),
  leverage: z.number().int().min(1).max(100),
  // 지정가(데모): 바로 체결된 것으로 처리
  price: z.number().positive().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = BodySchema.parse(await readBody(event))

  const usdt = await getDbBalance(user.id)

  const entry = body.price ?? (await getOkxLastPrice(body.symbol)).last
  
  let actualMargin = body.margin
  let fee = actualMargin * 0.04

  if (usdt < actualMargin + fee) {
    if (usdt <= 0) {
      throw createError({ statusCode: 400, statusMessage: '잔고가 부족합니다.' })
    }
    // 남은 예수금이 부족할 때: 가진 돈 전부(usdt)에서 수수료 4%를 뺀 나머지만 실제 마진으로 사용
    fee = usdt * 0.04
    actualMargin = usdt - fee
  }

  const qty = (actualMargin * body.leverage) / entry

  // Deduct margin and fee
  await incrementDbBalance(user.id, -(actualMargin + fee))

  await createDbPosition(
    user.id,
    body.symbol.toUpperCase(),
    body.side,
    qty,
    entry,
    body.leverage,
    actualMargin
  )

  await createDbExecution(
    user.id,
    body.symbol.toUpperCase(),
    body.side === 'long' ? 'BUY' : 'SELL',
    entry,
    qty,
    fee,
    0.0
  )

  await logBuy({
    userId: user.id,
    symbol: body.symbol.toUpperCase(),
    side: body.side,
    buy_price: entry,
    qty,
    margin: actualMargin,
    leverage: body.leverage
  })

  return { ok: true, entryPrice: entry, qty }
})
