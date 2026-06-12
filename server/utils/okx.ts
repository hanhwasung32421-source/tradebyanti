function toInstId(symbol: string) {
  // 현재는 BTCUSDT 같은 형태만 지원
  const s = symbol.toUpperCase().replace('-', '').replace('/', '')
  if (s === 'BTCUSDT') return 'BTC-USDT'
  if (s === 'ETHUSDT') return 'ETH-USDT'
  return 'BTC-USDT'
}

export async function getOkxLastPrice(symbol: string) {
  const instId = toInstId(symbol)
  const res = await $fetch<any>('https://www.okx.com/api/v5/market/ticker', {
    query: { instId }
  })
  const last = Number(res?.data?.[0]?.last ?? NaN)
  if (!Number.isFinite(last)) {
    throw createError({ statusCode: 502, statusMessage: '시세 조회 실패' })
  }
  return { instId, last }
}

