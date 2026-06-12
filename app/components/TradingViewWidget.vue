<template>
  <div class="h-full w-full">
    <div :id="containerId" class="h-full w-full" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  symbol: string // 예: OKX:DOGEUSDT.P
  interval?: string // 예: 1, 5, 15
}>()

const containerId = `tv_${Math.random().toString(36).slice(2)}`

function loadTvScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('tradingview-tvjs') as HTMLScriptElement | null
    if (existing) return resolve()

    const s = document.createElement('script')
    s.id = 'tradingview-tvjs'
    s.src = 'https://s3.tradingview.com/tv.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('TradingView script load failed'))
    document.head.appendChild(s)
  })
}

async function render() {
  await loadTvScript()
  const tv = (window as any).TradingView
  if (!tv?.widget) throw new Error('TradingView widget not available')

  // eslint-disable-next-line new-cap
  new tv.widget({
    autosize: true,
    symbol: props.symbol,
    interval: props.interval || '15',
    timezone: 'Asia/Seoul',
    theme: 'dark',
    style: '1',
    locale: 'kr',
    toolbar_bg: '#0b1220',
    enable_publishing: false,
    hide_side_toolbar: false,
    allow_symbol_change: false,
    container_id: containerId
  })
}

onMounted(() => {
  render().catch((e) => {
    // 실패 시에도 화면이 죽지 않게
    // eslint-disable-next-line no-console
    console.error(e)
  })
})

watch(
  () => [props.symbol, props.interval],
  () => {
    // 심볼/주기 변경 시 새 컨테이너로 재렌더
    // TradingView 위젯은 완전한 dispose가 까다로워서, 페이지 이동/리로드 방식으로 처리
  }
)
</script>

