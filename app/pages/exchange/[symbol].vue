<template>
  <div class="space-y-4">
    <!-- 상단 요약 -->
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-full bg-amber-500/20 ring-1 ring-amber-400/40" />
        <div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold">{{ symbol }}</span>
            <select
              v-model="symbolSelect"
              class="rounded-md bg-black/20 px-2 py-1 text-xs ring-1 ring-white/10"
              @change="onChangeSymbol"
            >
              <option value="BTCUSDT">BTCUSDT</option>
              <option value="DOGEUSDT">DOGEUSDT</option>
              <option value="ETHUSDT">ETHUSDT</option>
            </select>
          </div>
          <div class="font-mono text-2xl">{{ lastPrice ? fmtPrice(lastPrice) : '—' }}</div>
        </div>
        <div class="hidden sm:flex items-center gap-4 text-xs text-slate-300">
          <div>24h 고가 <span class="font-mono text-slate-100">{{ high24 ? fmtPrice(high24) : '—' }}</span></div>
          <div>24h 저가 <span class="font-mono text-slate-100">{{ low24 ? fmtPrice(low24) : '—' }}</span></div>
          <div>24h 거래량 <span class="font-mono text-slate-100">{{ vol24 ? fmtNum(vol24) : '—' }}</span></div>
        </div>
      </div>

      <div class="flex items-center gap-4 text-xs text-slate-300">
        <div class="hidden md:block">
          펀딩(예시) <span class="font-mono text-rose-300">0.0027%</span>
        </div>
        <div class="hidden md:block">
          카운트다운(예시) <span class="font-mono text-slate-100">01:45:32</span>
        </div>
        <div class="rounded-md bg-black/20 px-2 py-1 ring-1 ring-white/10">
          WS <span class="font-mono">{{ wsStatus || '—' }}</span>
        </div>
      </div>
    </div>

    <!-- 메인 영역 (차트 / 호가 / 주문하기) -->
    <!-- 좁아져도 패널이 '줄어들어 깨지는' 대신, 최소폭 이하에서는 가로 스크롤 -->
    <div class="overflow-x-auto">
      <div
        class="grid min-w-[1280px] grid-cols-[minmax(720px,1fr)_320px_360px] gap-3"
      >
      <!-- 차트 -->
      <section class="rounded-xl border border-white/10 bg-white/5 p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-semibold">차트</div>
          <div class="flex items-center gap-2 text-xs">
            <button
              type="button"
              class="rounded-md px-2 py-1 ring-1"
              :class="chartMode === 'tradingview' ? 'bg-white/10 ring-white/20' : 'bg-black/10 ring-white/10 hover:bg-white/10'"
              @click="chartMode = 'tradingview'"
            >
              TradingView
            </button>
            <button
              type="button"
              class="rounded-md px-2 py-1 ring-1"
              :class="chartMode === 'built' ? 'bg-white/10 ring-white/20' : 'bg-black/10 ring-white/10 hover:bg-white/10'"
              @click="chartMode = 'built'"
            >
              기본차트
            </button>
            <select v-model="timeframe" class="rounded-md bg-black/20 px-2 py-1 ring-1 ring-white/10">
              <option value="1m">1분</option>
              <option value="5m">5분</option>
              <option value="15m">15분</option>
            </select>
            <button class="rounded-md bg-white/10 px-2 py-1 hover:bg-white/15" @click="reloadCandles">새로고침</button>
          </div>
        </div>
        <div class="mt-3 h-[560px] w-full overflow-hidden rounded-lg bg-black/40">
          <ClientOnly>
            <TradingViewWidget
              v-if="chartMode === 'tradingview'"
              :symbol="tvSymbol"
              :interval="tvInterval"
            />
            <div v-else ref="chartEl" class="h-full w-full" />
          </ClientOnly>
        </div>
      </section>

      <!-- 호가 -->
      <section class="rounded-xl border border-white/10 bg-white/5 p-3">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold">호가</div>
          <button class="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15" @click="reconnect">재연결</button>
        </div>

        <div class="mt-3 text-xs text-slate-400 grid grid-cols-3 gap-2">
          <div class="text-right">가격(USDT)</div>
          <div class="text-right">수량</div>
          <div class="text-right">총 금액</div>
        </div>

        <div class="mt-2 h-[560px] rounded-lg bg-black/20 p-2">
          <div class="h-full overflow-y-auto">
        <!-- 매도 -->
        <div class="space-y-1">
          <div
            v-for="a in asks"
            :key="a[0]"
            class="grid grid-cols-3 gap-2 font-mono text-xs"
          >
            <div class="text-right text-rose-300">{{ a[0] }}</div>
            <div class="text-right text-slate-200">{{ a[1] }}</div>
            <div class="text-right text-slate-400">{{ fmtNum(Number(a[0]) * Number(a[1])) }}</div>
          </div>
        </div>

        <!-- 현재가 -->
        <div class="my-2 rounded-md bg-black/30 px-3 py-2 text-center font-mono text-sm ring-1 ring-white/10">
          {{ lastPrice ? fmtPrice(lastPrice) : '—' }}
        </div>

        <!-- 매수 -->
        <div class="space-y-1">
          <div
            v-for="b in bids"
            :key="b[0]"
            class="grid grid-cols-3 gap-2 font-mono text-xs"
          >
            <div class="text-right text-emerald-300">{{ b[0] }}</div>
            <div class="text-right text-slate-200">{{ b[1] }}</div>
            <div class="text-right text-slate-400">{{ fmtNum(Number(b[0]) * Number(b[1])) }}</div>
          </div>
        </div>
          </div>
        </div>
      </section>

      <!-- 주문하기 -->
      <section class="rounded-xl border border-white/10 bg-white/5 p-3">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold">주문하기</div>
          <div class="flex items-center gap-2 text-xs">
            <span class="rounded-md bg-black/20 px-2 py-1 ring-1 ring-white/10">격리</span>
            <span class="rounded-md bg-black/20 px-2 py-1 ring-1 ring-white/10">x{{ leverage }}</span>
          </div>
        </div>

        <div class="mt-3 flex gap-2 text-xs">
          <button
            class="flex-1 rounded-md px-3 py-2 ring-1"
            :class="orderType === 'market' ? 'bg-white/10 ring-white/20' : 'bg-black/10 ring-white/10 hover:bg-white/10'"
            @click="orderType = 'market'"
            type="button"
          >
            시장가
          </button>
          <button
            class="flex-1 rounded-md px-3 py-2 ring-1"
            :class="orderType === 'limit' ? 'bg-white/10 ring-white/20' : 'bg-black/10 ring-white/10 hover:bg-white/10'"
            @click="orderType = 'limit'"
            type="button"
          >
            지정가
          </button>
          <button
            class="flex-1 rounded-md px-3 py-2 ring-1"
            :class="orderType === 'trigger' ? 'bg-white/10 ring-white/20' : 'bg-black/10 ring-white/10 hover:bg-white/10'"
            @click="orderType = 'trigger'"
            type="button"
          >
            예약
          </button>
        </div>

        <div v-if="!me" class="mt-4 rounded-lg bg-black/20 p-3 text-sm text-slate-300">
          주문하려면 <NuxtLink to="/auth/login" class="text-indigo-300 hover:underline">로그인</NuxtLink>이 필요합니다.
        </div>

        <div class="mt-3 h-[560px] rounded-lg bg-black/20 p-3">
        <form v-if="me" class="space-y-3" @submit.prevent="openPosition">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>가격</span>
              <span class="font-mono">USDT</span>
            </div>
            <input
              class="mt-1 w-full rounded-md bg-black/20 px-3 py-2 font-mono text-sm ring-1 ring-white/10"
              :value="orderType === 'market' ? '시장가' : (lastPrice ? fmtPrice(lastPrice) : '')"
              disabled
            />
          </div>

          <div>
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>증거금</span>
              <span class="font-mono">USDT</span>
            </div>
            <input
              v-model.number="margin"
              type="number"
              min="1"
              step="1"
              class="mt-1 w-full rounded-md bg-black/20 px-3 py-2 font-mono text-sm ring-1 ring-white/10 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>레버리지</span>
              <span class="font-mono">x{{ leverage }}</span>
            </div>
            <input v-model.number="leverage" type="range" min="1" max="100" class="mt-2 w-full" />
            <div class="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>
          </div>

          <div class="rounded-lg bg-black/20 p-3 text-xs text-slate-300">
            <div class="flex justify-between">
              <span>사용가능 금액</span><span class="font-mono">{{ balance.toFixed(2) }} USDT</span>
            </div>
            <div class="mt-2 flex justify-between">
              <span>최대 볼륨(대략)</span>
              <span class="font-mono">{{ maxVolumeText }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              class="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
              :disabled="loading"
              @click="side = 'long'; openPosition()"
            >
              롱 오픈
            </button>
            <button
              type="button"
              class="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold hover:bg-rose-500"
              :disabled="loading"
              @click="side = 'short'; openPosition()"
            >
              숏 오픈
            </button>
          </div>

          <p v-if="error" class="text-sm text-rose-300">{{ error }}</p>
          <p v-if="tradeMsg" class="text-sm text-emerald-300">{{ tradeMsg }}</p>
          <div class="mt-4 rounded-lg bg-black/30 p-3 text-xs text-slate-300 ring-1 ring-white/10">
            <div class="font-semibold text-slate-200">보유자산</div>
            <div class="mt-2 space-y-1">
              <div class="flex justify-between"><span>USDT</span><span class="font-mono">{{ balance.toFixed(2) }}</span></div>
              <div class="flex justify-between"><span>미체결 주문</span><span class="font-mono">0</span></div>
              <div class="flex justify-between"><span>포지션</span><span class="font-mono">{{ positions.length }}</span></div>
            </div>
          </div>
        </form>
        <div v-else class="rounded-lg bg-black/20 p-3 text-sm text-slate-300">
          주문하려면 <NuxtLink to="/auth/login" class="text-indigo-300 hover:underline">로그인</NuxtLink>이 필요합니다.
        </div>
        </div>
      </section>
      </div>
    </div>

    <!-- 하단: 포지션 테이블 -->
    <section class="rounded-xl border border-white/10 bg-white/5 p-3">
      <div class="flex items-end justify-between gap-3">
        <div>
          <div class="text-sm font-semibold">포지션</div>
          <div class="text-xs text-slate-400">오픈 포지션 / 청산(모의)</div>
        </div>
        <button class="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/15" @click="loadAccount">새로고침</button>
      </div>

      <div class="mt-3 overflow-auto">
        <table class="w-full text-xs">
          <thead class="text-slate-400">
            <tr class="text-left">
              <th class="py-2">코인</th>
              <th class="py-2">포지션</th>
              <th class="py-2">수량</th>
              <th class="py-2">진입가격</th>
              <th class="py-2">증거금</th>
              <th class="py-2">Close</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="positions.length === 0" class="border-t border-white/10">
              <td colspan="6" class="py-3 text-slate-400">데이터가 없습니다.</td>
            </tr>
            <tr v-for="p in positions" :key="p.id" class="border-t border-white/10">
              <td class="py-2 font-mono">{{ p.symbol }}</td>
              <td class="py-2" :class="p.side === 'long' ? 'text-emerald-300' : 'text-rose-300'">
                {{ p.side.toUpperCase() }} x{{ p.leverage }}
              </td>
              <td class="py-2 font-mono">{{ Number(p.qty).toFixed(6) }}</td>
              <td class="py-2 font-mono">{{ fmtPrice(Number(p.entry_price)) }}</td>
              <td class="py-2 font-mono">{{ Number(p.margin).toFixed(2) }}</td>
              <td class="py-2">
                <button class="rounded-md bg-amber-500/20 px-2 py-1 ring-1 ring-amber-400/40 hover:bg-amber-500/30" @click="closePosition(p.id)">
                  청산
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData } from 'lightweight-charts'

definePageMeta({ middleware: ['auth'], layout: 'trading' })

const route = useRoute()
const router = useRouter()
const symbol = computed(() => String(route.params.symbol || 'BTCUSDT').toUpperCase())
const symbolSelect = ref(symbol.value)

watch(
  () => symbol.value,
  (v) => {
    symbolSelect.value = v
  }
)

function onChangeSymbol() {
  router.push(`/exchange/${symbolSelect.value}`)
}

const timeframe = ref<'1m' | '5m' | '15m'>('1m')
const chartMode = ref<'tradingview' | 'built'>('tradingview')
const orderType = ref<'market' | 'limit' | 'trigger'>('market')

const { me, refresh: refreshMe } = useMe()
await refreshMe()

// ticker
const lastPrice = ref<number | null>(null)
const high24 = ref<number | null>(null)
const low24 = ref<number | null>(null)
const vol24 = ref<number | null>(null)

// books
const asks = ref<[string, string][]>([])
const bids = ref<[string, string][]>([])
const wsStatus = ref('')
let ws: WebSocket | null = null

// trade panel
const side = ref<'long' | 'short'>('long')
const margin = ref<number>(100)
const leverage = ref<number>(20)
const loading = ref(false)
const error = ref<string | null>(null)
const tradeMsg = ref<string | null>(null)

// account
const balance = ref(0)
const positions = ref<any[]>([])

// chart
const chartEl = ref<HTMLElement | null>(null)
let chart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let volumeSeries: ISeriesApi<'Histogram'> | null = null

const tvSymbol = computed(() => {
  // TradingView: OKX 무기한은 .P 심볼을 사용 (예: OKX:DOGEUSDT.P)
  return `OKX:${symbol.value}.P`
})
const tvInterval = computed(() => {
  if (timeframe.value === '1m') return '1'
  if (timeframe.value === '5m') return '5'
  return '15'
})

function fmtPrice(v: number) {
  if (!Number.isFinite(v)) return '—'
  // DOGE 같이 작은 값 대비
  const digits = v < 1 ? 6 : 2
  return v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
function fmtNum(v: number) {
  if (!Number.isFinite(v)) return '—'
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

const maxVolumeText = computed(() => {
  if (!lastPrice.value) return '—'
  const max = (balance.value * leverage.value) / lastPrice.value
  return `${max.toFixed(6)}`
})

function toInstId(sym: string) {
  const s = sym.toUpperCase().replace('-', '').replace('/', '')
  if (s === 'BTCUSDT') return 'BTC-USDT-SWAP'
  if (s === 'ETHUSDT') return 'ETH-USDT-SWAP'
  if (s === 'DOGEUSDT') return 'DOGE-USDT-SWAP'
  return 'BTC-USDT-SWAP'
}

function initChart() {
  if (!chartEl.value || chart) return
  const rect = chartEl.value.getBoundingClientRect()
  chart = createChart(chartEl.value, {
    width: Math.max(300, Math.floor(rect.width)),
    height: Math.max(400, Math.floor(rect.height)),
    layout: { background: { color: 'transparent' }, textColor: '#cbd5e1' },
    grid: { vertLines: { color: 'rgba(255,255,255,0.06)' }, horzLines: { color: 'rgba(255,255,255,0.06)' } },
    rightPriceScale: { borderColor: 'rgba(255,255,255,0.12)' },
    timeScale: { borderColor: 'rgba(255,255,255,0.12)', timeVisible: true, secondsVisible: false }
  })

  candleSeries = chart.addCandlestickSeries({
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444'
  })

  volumeSeries = chart.addHistogramSeries({
    priceFormat: { type: 'volume' },
    priceScaleId: ''
  })
  volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

  // ResizeObserver
  const ro = new ResizeObserver(() => {
    if (!chartEl.value || !chart) return
    const r = chartEl.value.getBoundingClientRect()
    chart.applyOptions({ width: Math.floor(r.width), height: Math.floor(r.height) })
  })
  ro.observe(chartEl.value)
}

async function fetchCandles() {
  const instId = toInstId(symbol.value)
  const bar = timeframe.value
  // OKX REST는 브라우저 CORS 이슈가 있을 수 있어 서버 프록시를 사용
  const res = await $fetch<any>('/api/okx/candles', { query: { instId, bar, limit: 120 } })
  const rows = (res?.data || []) as string[][]
  const candles: CandlestickData[] = []
  const vols: HistogramData[] = []

  // OKX는 최신이 앞에 오므로 reverse
  rows
    .slice()
    .reverse()
    .forEach((r) => {
      const ts = Number(r[0])
      const o = Number(r[1])
      const h = Number(r[2])
      const l = Number(r[3])
      const c = Number(r[4])
      const vol = Number(r[5] ?? 0)
      const time = Math.floor(ts / 1000) as any
      if ([o, h, l, c].some((x) => !Number.isFinite(x))) return
      candles.push({ time, open: o, high: h, low: l, close: c })
      vols.push({
        time,
        value: vol,
        color: c >= o ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'
      })
    })

  candleSeries?.setData(candles)
  volumeSeries?.setData(vols)
  chart?.timeScale().fitContent()

  if (candles.length) {
    lastPrice.value = candles[candles.length - 1].close
  }
}

async function reloadCandles() {
  await fetchCandles().catch(() => {})
}

function connectWs() {
  if (!process.client) return
  ws?.close()
  asks.value = []
  bids.value = []
  wsStatus.value = 'connecting'

  const instId = toInstId(symbol.value)
  ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public')

  ws.onopen = () => {
    wsStatus.value = 'open'
    ws?.send(
      JSON.stringify({
        op: 'subscribe',
        args: [
          { channel: 'tickers', instId },
          { channel: 'books5', instId }
        ]
      })
    )
  }
  ws.onclose = () => (wsStatus.value = 'closed')
  ws.onerror = () => (wsStatus.value = 'error')

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      const arg = msg?.arg
      const data = msg?.data?.[0]
      if (!arg || !data) return

      if (arg.channel === 'tickers') {
        const p = Number(data.last)
        if (Number.isFinite(p)) lastPrice.value = p
        high24.value = Number(data.high24h ?? data.high24) || high24.value
        low24.value = Number(data.low24h ?? data.low24) || low24.value
        vol24.value = Number(data.vol24h ?? data.vol24) || vol24.value
      }

      if (arg.channel === 'books5') {
        const a = (data.asks || []).slice(0, 10).map((x: any[]) => [x[0], x[1]] as [string, string])
        const b = (data.bids || []).slice(0, 10).map((x: any[]) => [x[0], x[1]] as [string, string])
        asks.value = a.reverse()
        bids.value = b
      }
    } catch {
      // ignore
    }
  }
}

function reconnect() {
  connectWs()
}

async function loadAccount() {
  if (!me.value) return
  const data = await $fetch<any>('/api/account')
  balance.value = data.balance.usdt
  positions.value = data.positions.filter((p: any) => p.symbol === symbol.value)
}

async function openPosition() {
  if (!me.value) return
  loading.value = true
  error.value = null
  tradeMsg.value = null
  try {
    await $fetch('/api/trade/open', {
      method: 'POST',
      body: { symbol: symbol.value, side: side.value, margin: margin.value, leverage: leverage.value }
    })
    tradeMsg.value = '포지션이 오픈되었습니다.'
    await loadAccount()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '오픈 실패'
  } finally {
    loading.value = false
  }
}

async function closePosition(positionId: number) {
  tradeMsg.value = null
  try {
    const res = await $fetch<any>('/api/trade/close', { method: 'POST', body: { positionId } })
    tradeMsg.value = `청산 완료 · PnL ${res.pnl >= 0 ? '+' : ''}${Number(res.pnl).toFixed(2)} USDT`
    await loadAccount()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '청산 실패'
  }
}

watch([() => symbol.value, timeframe], async () => {
  // 심볼/타임프레임 변경 시 차트/WS 재연결
  if (chartMode.value === 'built') {
    await fetchCandles().catch(() => {})
  }
  connectWs()
  await loadAccount()
})

onMounted(async () => {
  initChart()
  if (chartMode.value === 'built') {
    await fetchCandles().catch(() => {})
  }
  connectWs()
  await loadAccount()
})

onBeforeUnmount(() => {
  ws?.close()
  ws = null
})
</script>
