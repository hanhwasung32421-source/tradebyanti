<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">{{ symbol }}</h1>
        <p class="mt-1 text-sm text-slate-400">
          OKX 공개 시세 기반 (차트/호가) · 모의체결(가상 USDT)
        </p>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div class="text-xs text-slate-400">현재가</div>
        <div class="mt-1 font-mono text-2xl">{{ lastPrice ? lastPrice.toFixed(2) : '—' }}</div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <section class="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">차트</h2>
          <div class="text-xs text-slate-400">간단 라인차트(틱 기반)</div>
        </div>
        <div ref="chartEl" class="mt-3 h-[360px] w-full overflow-hidden rounded-xl bg-black/40"></div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">호가(상위 10)</h2>
          <button class="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15" @click="reconnect">재연결</button>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div class="mb-2 text-slate-400">매도</div>
            <div v-for="a in asks" :key="a[0]" class="flex justify-between font-mono">
              <span class="text-rose-300">{{ a[0] }}</span>
              <span class="text-slate-300">{{ a[1] }}</span>
            </div>
          </div>
          <div>
            <div class="mb-2 text-slate-400">매수</div>
            <div v-for="b in bids" :key="b[0]" class="flex justify-between font-mono">
              <span class="text-emerald-300">{{ b[0] }}</span>
              <span class="text-slate-300">{{ b[1] }}</span>
            </div>
          </div>
        </div>
        <p v-if="wsStatus" class="mt-3 text-xs text-slate-500">WS: {{ wsStatus }}</p>
      </section>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <section class="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-1">
        <h2 class="font-semibold">모의체결</h2>
        <p class="mt-1 text-sm text-slate-400">증거금(USDT) + 레버리지로 포지션을 오픈합니다.</p>

        <div v-if="!me" class="mt-4 rounded-xl bg-black/20 p-4 text-sm text-slate-300">
          거래하려면 <NuxtLink to="/auth/login" class="text-indigo-300 hover:underline">로그인</NuxtLink>이 필요합니다.
        </div>

        <form v-else class="mt-4 space-y-3" @submit.prevent="openPosition">
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-lg px-3 py-2 text-sm font-medium"
              :class="side === 'long' ? 'bg-emerald-500/20 ring-1 ring-emerald-400' : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'"
              @click="side = 'long'"
            >
              롱
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-2 text-sm font-medium"
              :class="side === 'short' ? 'bg-rose-500/20 ring-1 ring-rose-400' : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'"
              @click="side = 'short'"
            >
              숏
            </button>
          </div>
          <div>
            <label class="text-sm text-slate-300">증거금 (USDT)</label>
            <input v-model.number="margin" type="number" min="1" step="1" class="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="text-sm text-slate-300">레버리지</label>
            <input v-model.number="leverage" type="number" min="1" max="100" step="1" class="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-500" />
          </div>
          <button class="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400" :disabled="loading">
            포지션 오픈
          </button>
          <p v-if="error" class="text-sm text-rose-300">{{ error }}</p>
        </form>

        <div v-if="me" class="mt-4 rounded-xl bg-black/20 p-4">
          <div class="text-xs text-slate-400">가상 잔고</div>
          <div class="mt-1 font-mono text-xl">{{ balance.toFixed(2) }} USDT</div>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
        <div class="flex items-end justify-between gap-3">
          <div>
            <h2 class="font-semibold">오픈 포지션</h2>
            <p class="mt-1 text-sm text-slate-400">청산 시 거래내역으로 저장되고 수익인증에서 카드 생성 가능</p>
          </div>
          <button class="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15" @click="loadAccount">새로고침</button>
        </div>
        <div class="mt-3 space-y-2">
          <div v-if="positions.length === 0" class="text-sm text-slate-400">오픈 포지션이 없습니다.</div>
          <div v-for="p in positions" :key="p.id" class="rounded-xl bg-black/20 p-4 text-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-medium">
                #{{ p.id }} · {{ p.symbol }} · {{ p.side.toUpperCase() }} · x{{ p.leverage }}
              </div>
              <button class="rounded-md bg-amber-500/20 px-3 py-1 text-sm ring-1 ring-amber-400/50 hover:bg-amber-500/30" @click="closePosition(p.id)">
                청산
              </button>
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div>수량(BTC): <span class="font-mono text-slate-200">{{ Number(p.qty).toFixed(6) }}</span></div>
              <div>진입가: <span class="font-mono text-slate-200">{{ Number(p.entry_price).toFixed(2) }}</span></div>
              <div>증거금: <span class="font-mono text-slate-200">{{ Number(p.margin).toFixed(2) }}</span></div>
              <div>생성: <span class="font-mono text-slate-200">{{ p.created_at.slice(0, 19) }}</span></div>
            </div>
          </div>
        </div>
        <p v-if="tradeMsg" class="mt-3 text-sm text-emerald-300">{{ tradeMsg }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createChart, type IChartApi, type ISeriesApi, type LineData } from 'lightweight-charts'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const symbol = computed(() => String(route.params.symbol || 'BTCUSDT').toUpperCase())

const { me, refresh: refreshMe } = useMe()
await refreshMe()

const chartEl = ref<HTMLElement | null>(null)
let chart: IChartApi | null = null
let series: ISeriesApi<'Line'> | null = null

const lastPrice = ref<number | null>(null)
const asks = ref<[string, string][]>([])
const bids = ref<[string, string][]>([])
const wsStatus = ref('')
let ws: WebSocket | null = null

const side = ref<'long' | 'short'>('long')
const margin = ref<number>(100)
const leverage = ref<number>(20)
const loading = ref(false)
const error = ref<string | null>(null)
const tradeMsg = ref<string | null>(null)

const balance = ref(0)
const positions = ref<any[]>([])

function toInstId(sym: string) {
  const s = sym.toUpperCase().replace('-', '').replace('/', '')
  if (s === 'BTCUSDT') return 'BTC-USDT'
  if (s === 'ETHUSDT') return 'ETH-USDT'
  return 'BTC-USDT'
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

  ws.onclose = () => {
    wsStatus.value = 'closed'
  }
  ws.onerror = () => {
    wsStatus.value = 'error'
  }

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      const arg = msg?.arg
      const data = msg?.data?.[0]
      if (!arg || !data) return

      if (arg.channel === 'tickers') {
        const p = Number(data.last)
        if (Number.isFinite(p)) {
          lastPrice.value = p
          pushChart(p)
        }
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

function initChart() {
  if (!chartEl.value || chart) return
  chart = createChart(chartEl.value, {
    layout: { background: { color: 'transparent' }, textColor: '#cbd5e1' },
    grid: { vertLines: { color: 'rgba(255,255,255,0.06)' }, horzLines: { color: 'rgba(255,255,255,0.06)' } },
    rightPriceScale: { borderColor: 'rgba(255,255,255,0.12)' },
    timeScale: { borderColor: 'rgba(255,255,255,0.12)', timeVisible: true, secondsVisible: true }
  })
  series = chart.addLineSeries({ color: '#a5b4fc', lineWidth: 2 })
}

function pushChart(price: number) {
  if (!series) return
  const t = Math.floor(Date.now() / 1000)
  const point: LineData = { time: t as any, value: price }
  series.update(point)
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

onMounted(async () => {
  initChart()
  connectWs()
  await loadAccount()
})

onBeforeUnmount(() => {
  ws?.close()
  ws = null
})
</script>

