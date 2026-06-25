<template>
  <div class="space-y-4">
    <!-- 메인 영역 (차트 / 오더북 / 보유자산) -->
    <!-- 좁아져도 패널이 '줄어들어 깨지는' 대신, 최소폭 이하에서는 가로 스크롤 -->
    <div class="overflow-x-auto">
      <!-- 첨부 화면 비율: 차트 크게 + 오더북/보유자산 작게 -->
      <div class="grid min-w-[1280px] grid-cols-[minmax(720px,1fr)_320px_360px] gap-3">
      <!-- 차트 -->
      <section class="rounded-xl border border-white/10 bg-white/5 p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <span class="text-lg font-bold text-white">{{ symbol }}</span>
            <span class="font-mono text-base text-[#00b075] font-bold px-1">{{ lastPrice ? fmtPrice(lastPrice) : '—' }}</span>
            <select
              v-model="symbolSelect"
              class="rounded-md bg-black/40 border border-white/10 px-2 py-0.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-[#00b075] cursor-pointer"
              @change="onChangeSymbol"
            >
              <option value="BTCUSDT" class="bg-slate-900 text-slate-200">BTCUSDT</option>
              <option value="DOGEUSDT" class="bg-slate-900 text-slate-200">DOGEUSDT</option>
              <option value="ETHUSDT" class="bg-slate-900 text-slate-200">ETHUSDT</option>
            </select>
          </div>
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
              :key="tvSymbol + ':' + tvInterval"
              :symbol="tvSymbol"
              :interval="tvInterval"
              :entry-lines="tvEntryLines"
            />
            <div v-else ref="chartEl" class="h-full w-full" />
          </ClientOnly>
        </div>
      </section>

      <!-- 오더북(첨부 스타일) -->
      <section class="rounded-xl border border-white/10 bg-white/5 p-3">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold">호가창</div>
          <button class="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15" @click="reconnect">재연결</button>
        </div>

        <div class="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
          <div>가격</div>
          <div class="text-center">수량</div>
          <div class="text-right">총량</div>
        </div>

        <div class="mt-2 h-[560px] rounded-lg bg-black/20 p-2">
          <div class="h-full overflow-y-hidden">
            <!-- 매도(위) -->
            <div class="space-y-[3px]">
              <div
                v-for="(r, idx) in askRows"
                :key="'a' + idx"
                class="grid h-8 grid-cols-3 items-center gap-2 font-mono text-xs"
              >
                <div class="text-slate-200">{{ r ? fmtPrice(r.price) : '—' }}</div>
                <div class="relative overflow-hidden rounded-sm bg-rose-600/80 px-2 py-1 text-center text-slate-100">
                  {{ r ? r.qtyText : '—' }}
                </div>
                <div class="relative overflow-hidden rounded-sm px-2 py-1 text-right text-slate-100">
                  <div
                    v-if="r"
                    class="absolute inset-y-0 right-0 bg-rose-500/35"
                    :style="{ width: r.depthPct + '%' }"
                  />
                  <span class="relative">{{ r ? r.totalText : '—' }}</span>
                </div>
              </div>
            </div>

            <!-- 현재가 -->
            <div class="my-3 text-center font-mono text-lg text-emerald-300">
              {{ lastPrice ? fmtPrice(lastPrice) : '—' }} <span class="text-sm text-slate-300">USDT</span>
            </div>

            <!-- 매수(아래) -->
            <div class="space-y-[3px]">
              <div
                v-for="(r, idx) in bidRows"
                :key="'b' + idx"
                class="grid h-8 grid-cols-3 items-center gap-2 font-mono text-xs"
              >
                <div class="text-slate-200">{{ r ? fmtPrice(r.price) : '—' }}</div>
                <div class="relative overflow-hidden rounded-sm bg-emerald-600/80 px-2 py-1 text-center text-slate-100">
                  {{ r ? r.qtyText : '—' }}
                </div>
                <div class="relative overflow-hidden rounded-sm px-2 py-1 text-right text-slate-100">
                  <div
                    v-if="r"
                    class="absolute inset-y-0 right-0 bg-emerald-500/35"
                    :style="{ width: r.depthPct + '%' }"
                  />
                  <span class="relative">{{ r ? r.totalText : '—' }}</span>
                </div>
              </div>
            </div>

            <!-- BUY/SELL 비율 -->
            <div class="mt-4">
              <div class="h-5 w-full overflow-hidden rounded bg-black/30 ring-1 ring-white/10">
                <div class="flex h-full w-full">
                  <div class="bg-emerald-500" :style="{ width: buyPct + '%' }" />
                  <div class="bg-rose-500" :style="{ width: 100 - buyPct + '%' }" />
                </div>
              </div>
              <div class="mt-1 flex items-center justify-between text-xs">
                <div class="font-mono text-emerald-300">{{ buyPct.toFixed(0) }}%</div>
                <div class="font-mono text-rose-300">{{ (100 - buyPct).toFixed(0) }}%</div>
              </div>
              <div class="mt-1 flex items-center justify-between text-xs text-slate-400">
                <div class="font-semibold text-emerald-300">BUY</div>
                <div class="font-semibold text-rose-300">SELL</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 보유자산 (주문 패널) -->
      <section class="rounded-xl border border-white/10 bg-white/5 p-3">
        <!-- Title & Subtitle: 보유자산 및 잔고 -->
        <div class="flex flex-col gap-1">
          <div class="text-xs text-slate-400 font-semibold">보유자산</div>
          <div class="font-mono text-2xl font-bold text-white">{{ fmtPrice(balance) }} USDT</div>
        </div>

        <div v-if="!me" class="mt-4 rounded-lg bg-black/20 p-3 text-sm text-slate-300">
          주문하려면 <NuxtLink to="/auth/login" class="text-indigo-300 hover:underline">로그인</NuxtLink>이 필요합니다.
        </div>

        <div v-else class="mt-3 rounded-lg bg-black/20 p-3 space-y-4">
          <!-- Leverage & Margin Mode Selector Row -->
          <div class="grid grid-cols-2 gap-2">
            <!-- Leverage Button -->
            <div 
              class="flex items-center justify-between rounded-lg bg-black/40 border border-white/10 px-3 py-2 cursor-pointer hover:bg-white/5 transition"
              @click="showLeverageSlider = !showLeverageSlider"
            >
              <span class="text-slate-400 text-xs font-semibold">레버리지</span>
              <span class="text-slate-100 font-mono text-xs font-bold flex items-center gap-1">
                {{ leverage }}x <span class="text-[9px] text-slate-400">▶</span>
              </span>
            </div>

            <!-- Margin Mode Button (격리 고정) -->
            <div 
              class="flex items-center justify-between rounded-lg border px-3 py-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            >
              <span class="text-xs font-semibold text-emerald-400">마진모드</span>
              <span class="font-bold text-xs">격리</span>
            </div>
          </div>

          <!-- Collapsible Leverage Slider -->
          <div v-if="showLeverageSlider" class="rounded-lg bg-black/40 border border-white/10 p-3 space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>레버리지 배율</span>
              <span class="font-mono text-slate-200 font-semibold">{{ leverage }}x</span>
            </div>
            <input 
              v-model.number="leverage" 
              type="range" 
              min="1" 
              max="100" 
              step="1" 
              class="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00b075]" 
            />
            <div class="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>1x</span>
              <span>25x</span>
              <span>50x</span>
              <span>75x</span>
              <span>100x</span>
            </div>
          </div>

          <!-- 탭 (시장가/지정가) -->
          <div class="grid grid-cols-2 gap-1 rounded-lg bg-black/40 p-1 text-xs border border-white/10">
            <button
              type="button"
              class="rounded-md py-2 font-semibold transition"
              :class="orderType === 'market' ? 'bg-[#00b075]/25 text-[#00b075] border border-[#00b075]/30' : 'text-slate-400 hover:bg-white/5'"
              @click="selectOrderType('market')"
            >
              시장가
            </button>
            <button
              type="button"
              class="rounded-md py-2 font-semibold transition"
              :class="orderType === 'limit' ? 'bg-[#00b075]/25 text-[#00b075] border border-[#00b075]/30' : 'text-slate-400 hover:bg-white/5'"
              @click="selectOrderType('limit')"
            >
              지정가
            </button>
          </div>

          <form class="space-y-3" @submit.prevent>
            <!-- 가격 입력창 (지정가인 경우에만 표시) -->
            <div v-if="orderType === 'limit'" class="flex items-center justify-between rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 font-mono text-sm">
              <span class="text-slate-400 text-xs font-semibold shrink-0 whitespace-nowrap">가격</span>
              <input 
                v-model.number="limitPrice" 
                type="number" 
                step="0.000001" 
                class="bg-transparent text-right outline-none text-slate-100 font-semibold flex-1 px-2 min-w-0"
                placeholder="0.000000"
              />
              <span class="text-slate-400 text-xs font-semibold shrink-0">USDT</span>
            </div>

            <!-- 수량 입력창 (비중 및 가격에 따라 계산된 값 표시) -->
            <div class="flex items-center justify-between rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 font-mono text-sm">
              <span class="text-slate-400 text-xs font-semibold shrink-0 whitespace-nowrap">수량</span>
              <span class="text-slate-100 font-semibold text-right flex-1 px-2 min-w-0">{{ qtyText }}</span>
              <span class="text-slate-400 text-xs font-semibold shrink-0">{{ coinUnit }}</span>
            </div>

            <!-- 비중 슬라이더 -->
            <div class="pt-1">
              <div class="relative flex items-center h-5">
                <!-- Custom Background Track -->
                <div class="absolute left-[6px] right-[6px] top-1/2 -translate-y-1/2 h-[3px] bg-slate-700 rounded-full pointer-events-none"></div>
                <!-- Custom Active Highlight Track -->
                <div 
                  class="absolute left-[6px] top-1/2 -translate-y-1/2 h-[3px] bg-[#00b075] rounded-full pointer-events-none"
                  :style="{ width: `calc(${percent}% - ${(percent / 100) * 12}px)` }"
                ></div>
                <!-- Dots on track -->
                <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10 px-[3px]">
                  <span 
                    v-for="p in [0, 25, 50, 75, 100]" 
                    :key="p" 
                    class="w-2.5 h-2.5 rounded-full border-2 transition-all duration-100"
                    :class="percent >= p ? 'border-[#00b075] bg-[#00b075]' : 'border-[#2d3748] bg-[#0f1423]'"
                  />
                </div>
                <!-- Native input slider on top -->
                <input
                  v-model.number="percent"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  class="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer z-20 outline-none"
                />
              </div>
              <!-- 슬라이더 틱 라벨 (0%, 25%, 50%, 75%, 100%) -->
              <div class="mt-1.5 flex justify-between text-[10px] text-slate-500 font-semibold font-mono px-0.5">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <!-- 비중 빠른 선택 버튼 (10%, 25%, 50%, 75%, 100%) -->
            <div class="grid grid-cols-5 gap-1 pt-1">
              <button
                v-for="p in [10, 25, 50, 75, 100]"
                :key="p"
                type="button"
                class="rounded bg-[#1c2230] hover:bg-[#283145] text-slate-300 py-1.5 text-xs font-semibold transition font-mono border border-white/5"
                @click="percent = p"
              >
                {{ p }}%
              </button>
            </div>



            <!-- 구매 / 판매 버튼 및 비용 표시 -->
            <div class="grid grid-cols-2 gap-3 pt-2">
              <!-- 구매 / 롱 -->
              <div class="space-y-1.5 text-center">
                <button
                  type="button"
                  class="w-full rounded-lg bg-[#00b075] hover:bg-[#009b67] text-white py-3 text-sm font-bold transition shadow-md active:scale-[0.98]"
                  :disabled="loading || orderType === 'trigger'"
                  @click="onOpen('long')"
                >
                  구매 / 롱
                </button>
                <div class="text-[10px] text-slate-400 font-mono">
                  비용 <span class="text-slate-200 font-semibold">{{ marginUsdt.toFixed(2) }}</span> USDT
                </div>
              </div>

              <!-- 판매 / 숏 -->
              <div class="space-y-1.5 text-center">
                <button
                  type="button"
                  class="w-full rounded-lg bg-[#f0384c] hover:bg-[#d82a3d] text-white py-3 text-sm font-bold transition shadow-md active:scale-[0.98]"
                  :disabled="loading || orderType === 'trigger'"
                  @click="onOpen('short')"
                >
                  판매 / 숏
                </button>
                <div class="text-[10px] text-slate-400 font-mono">
                  비용 <span class="text-slate-200 font-semibold">{{ marginUsdt.toFixed(2) }}</span> USDT
                </div>
              </div>
            </div>

            <p v-if="orderType === 'trigger'" class="text-xs text-slate-400 pt-2 text-center">StopLimit 예약 주문은 준비중입니다.</p>
            <p v-if="error" class="text-sm text-rose-400 pt-2 text-center">{{ error }}</p>
            <p v-if="tradeMsg" class="text-sm text-emerald-400 pt-2 text-center">{{ tradeMsg }}</p>
          </form>
        </div>
      </section>
      </div>
    </div>

    <!-- 하단: 포지션 테이블 -->
    <section class="rounded-xl border border-white/10 bg-white/5 p-3">
      <!-- Tabs Header -->
      <div class="flex items-center justify-between gap-3 border-b border-white/10 pb-2 mb-3">
        <div class="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 transition"
            :class="bottomTab === 'positions' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'"
            @click="bottomTab = 'positions'"
          >
            포지션 ({{ positions.length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-slate-600 cursor-not-allowed bg-black/20"
            disabled
          >
            카피 중인 매매 (0)
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 transition"
            :class="bottomTab === 'trades' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'"
            @click="bottomTab = 'trades'"
          >
            거래내역 ({{ trades?.length || 0 }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 transition"
            :class="bottomTab === 'executions' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'"
            @click="onSelectExecutionsTab"
          >
            체결내역
          </button>
        </div>
        <button class="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15 transition" @click="refreshActiveTab">새로고침</button>
      </div>

      <!-- Tab Contents: Positions -->
      <div class="mt-3 overflow-auto" v-if="bottomTab === 'positions'">
        <table class="w-full text-xs">
          <thead class="text-slate-400 border-b border-white/10">
            <tr class="text-left">
              <th class="py-2">코인</th>
              <th class="py-2">포지션</th>
              <th class="py-2">수량</th>
              <th class="py-2">진입가격</th>
              <th class="py-2">시장가</th>
              <th class="py-2">강제청산가격</th>
              <th class="py-2">증거금</th>
              <th class="py-2">미실현손익(ROE)</th>
              <th class="py-2">Close</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="positions.length === 0" class="border-t border-white/10">
              <td colspan="9" class="py-3 text-slate-400 text-center">데이터가 없습니다.</td>
            </tr>
            <tr v-for="p in positions" :key="p.id" class="border-t border-white/5 hover:bg-white/5 font-mono text-slate-300">
              <td class="py-2.5">
                <div class="flex items-center gap-2">
                  <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] ring-1 ring-amber-400/40">
                    {{ p.symbol?.slice(0, 1) }}
                  </span>
                  <span class="font-mono font-bold">{{ formatSymbol(p.symbol) }}</span>
                  <span class="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] ring-1 ring-white/10">x{{ p.leverage }}</span>
                </div>
              </td>
              <td class="py-2.5" :class="p.side === 'long' ? 'text-emerald-300' : 'text-rose-300'">
                <span class="rounded px-2 py-1 text-[10px] ring-1"
                  :class="p.side === 'long' ? 'bg-emerald-500/10 ring-emerald-400/30' : 'bg-rose-500/10 ring-rose-400/30'">
                  {{ p.side === 'long' ? 'LONG' : 'SHORT' }}
                </span>
              </td>
              <td class="py-2.5">{{ fmtQty(p.symbol, p.qty) }}</td>
              <td class="py-2.5">{{ fmtPrice(Number(p.entry_price)) }}</td>
              <td class="py-2.5">{{ lastPrice ? fmtPrice(lastPrice) : '—' }}</td>
              <td class="py-2.5">{{ fmtPrice(calcLiqPrice(p)) }}</td>
              <td class="py-2.5">{{ Number(p.margin).toFixed(2) }} USDT</td>
              <td class="py-2.5">
                <div class="font-mono font-bold" :class="unrealized(p).pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'">
                  {{ unrealized(p).pnl >= 0 ? '+' : '' }}{{ unrealized(p).pnl.toFixed(2) }} USDT
                </div>
                <div class="text-[10px] text-slate-400 font-mono">
                  {{ unrealized(p).roe >= 0 ? '+' : '' }}{{ unrealized(p).roe.toFixed(2) }}%
                </div>
              </td>
              <td class="py-2.5">
                <div class="flex items-center gap-2">
                  <button class="rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-2 py-1 border border-amber-500/20 transition" @click="closePosition(p.id)">
                    시장가 청산
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab Contents: Trades -->
      <div v-else-if="bottomTab === 'trades'" class="mt-3 overflow-auto max-h-[300px] pr-1">
        <table class="w-full text-xs">
          <thead class="text-slate-400 border-b border-white/10">
            <tr class="text-left">
              <th class="py-2">시간</th>
              <th class="py-2">종목</th>
              <th class="py-2 text-center">방향</th>
              <th class="py-2 text-right">수량</th>
              <th class="py-2 text-right">진입가</th>
              <th class="py-2 text-right">청산가</th>
              <th class="py-2 text-right">레버리지</th>
              <th class="py-2 text-right">실현손익</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!trades || trades.length === 0" class="border-t border-white/10 text-slate-400">
              <td colspan="8" class="py-3 text-center">거래내역이 없습니다.</td>
            </tr>
            <tr v-for="t in trades" :key="t.id" class="border-t border-white/5 hover:bg-white/5 font-mono text-slate-300">
              <td class="py-2.5 text-slate-400">{{ formatTime(t.created_at) }}</td>
              <td class="py-2.5 font-semibold text-slate-200">{{ formatSymbol(t.symbol) }}</td>
              <td class="py-2.5 text-center">
                <span :class="t.side === 'long' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'" class="px-2 py-0.5 rounded text-[10px] font-bold">
                  {{ t.side === 'long' ? 'LONG' : 'SHORT' }}
                </span>
              </td>
              <td class="py-2.5 text-right">{{ fmtQty(t.symbol, t.qty) }}</td>
              <td class="py-2.5 text-right">{{ fmtPrice(t.entry_price) }}</td>
              <td class="py-2.5 text-right">{{ fmtPrice(t.exit_price) }}</td>
              <td class="py-2.5 text-right">{{ t.leverage }}x</td>
              <td class="py-2.5 text-right font-semibold" :class="t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                {{ t.pnl >= 0 ? '+' : '' }}{{ t.pnl.toFixed(2) }} USDT
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab Contents: Executions -->
      <div v-else-if="bottomTab === 'executions'" class="mt-3 overflow-y-auto max-h-[300px] pr-1 space-y-2" @scroll="onExecutionsScroll">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="text-slate-400 border-b border-white/10">
              <th class="py-2">시간</th>
              <th class="py-2">종목</th>
              <th class="py-2 text-center">방향</th>
              <th class="py-2 text-right">체결가</th>
              <th class="py-2 text-right">수량</th>
              <th class="py-2 text-right">수수료</th>
              <th class="py-2 text-right">실현손익</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="executions.length === 0" class="text-slate-400 border-t border-white/10">
              <td colspan="7" class="py-3 text-center">체결내역이 없습니다.</td>
            </tr>
            <tr v-for="ex in executions" :key="ex.id" class="border-b border-white/5 hover:bg-white/5 font-mono text-slate-300">
              <td class="py-2.5 text-slate-400">{{ formatTime(ex.created_at) }}</td>
              <td class="py-2.5 font-semibold text-slate-200">{{ formatSymbol(ex.symbol) }}</td>
              <td class="py-2.5 text-center">
                <span :class="ex.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'" class="px-2 py-0.5 rounded text-[10px] font-bold">
                  {{ ex.side }}
                </span>
              </td>
              <td class="py-2.5 text-right font-semibold text-slate-200">{{ fmtPrice(ex.price) }}</td>
              <td class="py-2.5 text-right text-slate-200">{{ fmtQty(ex.symbol, ex.qty) }}</td>
              <td class="py-2.5 text-right text-slate-400">{{ ex.fee.toFixed(6) }} USDT</td>
              <td class="py-2.5 text-right font-bold" :class="ex.pnl > 0 ? 'text-emerald-400' : ex.pnl < 0 ? 'text-rose-400' : 'text-slate-500'">
                {{ ex.pnl > 0 ? '+' : '' }}{{ ex.pnl !== 0 ? ex.pnl.toFixed(4) + ' USDT' : '0 USDT' }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loadingExecutions" class="text-center text-xs text-slate-500 py-3 font-mono">불러오는 중...</div>
      </div>
    </section>
  </div>

  <!-- Premium Close Result Modal Card -->
  <div v-if="isCloseModalOpen && closeModalData" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md px-4" @click.self="closeCloseModal">
    <div class="relative w-full max-w-sm rounded-3xl p-8 overflow-hidden shadow-2xl border border-white/10 transition duration-300" 
         :class="closeModalData.pnl >= 0 ? 'bg-gradient-to-b from-[#0d382f] via-[#05211b] to-[#021310] shadow-emerald-950/30' : 'bg-gradient-to-b from-[#4a131b] via-[#2c0b10] to-[#140407] shadow-rose-950/30'">
      
      <!-- Background decorative blobs -->
      <div class="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20" :class="closeModalData.pnl >= 0 ? 'bg-emerald-400' : 'bg-rose-400'"></div>
      <div class="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20" :class="closeModalData.pnl >= 0 ? 'bg-teal-400' : 'bg-rose-500'"></div>

      <!-- Close Button -->
      <button class="absolute top-5 right-5 text-white/50 hover:text-white text-xl transition font-sans" @click="closeCloseModal">
        ✕
      </button>

      <!-- ROI & PNL Header -->
      <div class="text-left space-y-1">
        <div class="text-4xl font-bold tracking-tight" :class="closeModalData.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'">
          {{ calculateRoe(closeModalData) }}
        </div>
        <div class="text-2xl font-bold font-mono" :class="closeModalData.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'">
          {{ formatPnlWon(closeModalData.pnl) }}
        </div>
        <div class="text-sm text-white/60 font-mono">
          ({{ closeModalData.pnl >= 0 ? '+' : '' }}{{ closeModalData.pnl.toFixed(2) }} USDT)
        </div>
      </div>

      <!-- Detail Table -->
      <div class="mt-8 space-y-4 border-t border-white/10 pt-6 text-left">
        <div>
          <div class="text-[11px] uppercase tracking-wider text-white/40">코인</div>
          <div class="mt-0.5 text-base font-semibold">
            {{ formatSymbol(closeModalData.symbol) }}
            <span :class="closeModalData.side === 'long' ? 'text-emerald-400' : 'text-rose-400'" class="ml-1 text-sm font-bold">
              {{ closeModalData.side.toUpperCase() }}
            </span>
          </div>
        </div>
        <div>
          <div class="text-[11px] uppercase tracking-wider text-white/40">레버리지</div>
          <div class="mt-0.5 text-base font-semibold">{{ closeModalData.leverage }}x</div>
        </div>
        <div>
          <div class="text-[11px] uppercase tracking-wider text-white/40">진입가격</div>
          <div class="mt-0.5 text-base font-mono font-medium text-white/90">{{ fmtPrice(closeModalData.entryPrice) }}</div>
        </div>
        <div>
          <div class="text-[11px] uppercase tracking-wider text-white/40">종료가격</div>
          <div class="mt-0.5 text-base font-mono font-medium text-white/90">{{ fmtPrice(closeModalData.exitPrice) }}</div>
        </div>
      </div>

      <div class="mt-8 text-center text-[10px] text-white/30 uppercase tracking-widest font-mono">
        Virtual USDT Trading Result
      </div>
    </div>
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
const bottomTab = ref<'positions' | 'limit' | 'trigger'>('positions')

// 주문 UI 상태(첨부 스타일)
const percent = ref<number>(0)
const limitPrice = ref<number>(0)

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
const leverage = ref<number>(100)
const loading = ref(false)
const error = ref<string | null>(null)
const tradeMsg = ref<string | null>(null)
const showLeverageSlider = ref(false)
const marginMode = ref<'Isolated' | 'Cross'>('Isolated')

function toggleMarginMode() {
  marginMode.value = marginMode.value === 'Isolated' ? 'Cross' : 'Isolated'
}

// account
const balance = ref(0)
const positions = ref<any[]>([])

// chart
const chartEl = ref<HTMLElement | null>(null)
let chart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let volumeSeries: ISeriesApi<'Histogram'> | null = null
const priceLines: any[] = []

const tvSymbol = computed(() => {
  // TradingView: OKX 무기한은 .P 심볼을 사용 (예: OKX:DOGEUSDT.P)
  return `OKX:${symbol.value}.P`
})
const tvInterval = computed(() => {
  if (timeframe.value === '1m') return '1'
  if (timeframe.value === '5m') return '5'
  return '15'
})

const tvEntryLines = computed(() => {
  // TradingView 위젯이 지원하는 경우 진입 라인 전달
  return (positions.value || []).map((p: any) => ({
    price: Number(p.entry_price),
    side: p.side === 'short' ? 'short' : 'long'
  }))
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

function fmtDepth(v: number) {
  // 수량/총량 표시(첨부는 소수 3자리 정도)
  if (!Number.isFinite(v)) return '0.000'
  if (v >= 10) return v.toFixed(3)
  if (v >= 1) return v.toFixed(3)
  return v.toFixed(3)
}

type DepthRow = { price: number; qty: number; qtyText: string; total: number; totalText: string; depthPct: number }

// 오더북을 "가격 라더"처럼 유지하기 위해 Map으로 누적 업데이트
const obAsks = shallowRef<Map<number, number>>(new Map())
const obBids = shallowRef<Map<number, number>>(new Map())
// 화면에 보여줄 가격(고정): 매도 8줄(높은→낮은), 매수 7줄(높은→낮은)
const askDisplay = ref<number[]>([])
const bidDisplay = ref<number[]>([])

function resetOrderbook() {
  obAsks.value = new Map()
  obBids.value = new Map()
  askDisplay.value = []
  bidDisplay.value = []
}

function applyOrderbookUpdate(levels: any[], side: 'ask' | 'bid') {
  const map = side === 'ask' ? obAsks.value : obBids.value
  for (const lv of levels || []) {
    const price = Number(lv?.[0])
    const qty = Number(lv?.[1])
    if (!Number.isFinite(price) || !Number.isFinite(qty)) continue
    if (qty <= 0) map.delete(price)
    else map.set(price, qty)
  }

  // 너무 커지면 근처 레벨만 유지(성능/메모리)
  const entries = Array.from(map.entries())
  if (entries.length > 500) {
    const sorted =
      side === 'ask'
        ? entries.sort((a, b) => a[0] - b[0]).slice(0, 250)
        : entries.sort((a, b) => b[0] - a[0]).slice(0, 250)
    const next = new Map<number, number>()
    for (const [p, q] of sorted) next.set(p, q)
    if (side === 'ask') obAsks.value = next
    else obBids.value = next
  }
}

function getAskPricesAsc(limit = 200) {
  return Array.from(obAsks.value.keys()).sort((a, b) => a - b).slice(0, limit) // best ask 근처
}
function getBidPricesDesc(limit = 200) {
  return Array.from(obBids.value.keys()).sort((a, b) => b - a).slice(0, limit) // best bid 근처
}

function initDisplayFromMaps() {
  const asksAsc = getAskPricesAsc(300)
  const bidsDesc = getBidPricesDesc(300)
  // asks는 best ask부터 위로 6개를 뽑고(낮은→높은), 화면은 높은→낮은
  askDisplay.value = asksAsc.slice(0, 6).reverse()
  // bids는 높은→낮은 그대로 6개
  bidDisplay.value = bidsDesc.slice(0, 6)
}

function refreshDisplayIfNeeded() {
  // 가격 라더는 가급적 유지하고, "수량이 0이 되어 삭제된 가격"이 화면에 있으면 그때만 재구성
  const askMissing = askDisplay.value.some((p) => !obAsks.value.has(p))
  const bidMissing = bidDisplay.value.some((p) => !obBids.value.has(p))
  if (askMissing || askDisplay.value.length !== 6) {
    const asksAsc = getAskPricesAsc(300)
    askDisplay.value = asksAsc.slice(0, 6).reverse()
  }
  if (bidMissing || bidDisplay.value.length !== 6) {
    const bidsDesc = getBidPricesDesc(300)
    bidDisplay.value = bidsDesc.slice(0, 6)
  }
}

function buildRowsFromDisplay(side: 'ask' | 'bid', count: number): Array<DepthRow | null> {
  const map = side === 'ask' ? obAsks.value : obBids.value
  const prices = side === 'ask' ? askDisplay.value : bidDisplay.value

  if (!prices.length) return new Array(count).fill(null)
  const view = prices.slice(0, count)

  // 누적 총량: 아래에서 위로
  let cum = 0
  const totals: number[] = new Array(view.length).fill(0)
  for (let i = view.length - 1; i >= 0; i--) {
    const q = Number(map.get(view[i]) ?? 0)
    cum += q
    totals[i] = cum
  }
  const maxTotal = Math.max(...totals, 1)

  const rows: Array<DepthRow | null> = view.map((price, i) => {
    const qty = Number(map.get(price) ?? 0)
    return {
      price,
      qty,
      qtyText: fmtDepth(qty),
      total: totals[i],
      totalText: fmtDepth(totals[i]),
      depthPct: Math.min(100, (totals[i] / maxTotal) * 100)
    }
  })

  if (rows.length < count) return rows.concat(new Array(count - rows.length).fill(null))
  return rows
}

const askRows = computed(() => buildRowsFromDisplay('ask', 6))
const bidRows = computed(() => buildRowsFromDisplay('bid', 6))

const buyPct = computed(() => {
  // 화면에 보이는 수량 합 기준
  const buy = bidRows.value.reduce((s, r) => s + (r?.qty ?? 0), 0)
  const sell = askRows.value.reduce((s, r) => s + (r?.qty ?? 0), 0)
  const sum = buy + sell
  if (!sum) return 50
  return (buy / sum) * 100
})

function fmtQty(sym: string, qty: number) {
  const s = String(sym || '').toUpperCase()
  if (s.startsWith('DOGE')) return Number(qty).toFixed(2)
  return Number(qty).toFixed(6)
}

function calcLiqPrice(p: any) {
  const entry = Number(p.entry_price)
  const lev = Number(p.leverage || 1)
  if (!Number.isFinite(entry) || !Number.isFinite(lev) || lev <= 0) return 0
  // 데모용 근사치
  if (p.side === 'short') return entry * (1 + 1 / lev)
  return entry * (1 - 1 / lev)
}

function unrealized(p: any) {
  const mark = Number(lastPrice.value ?? 0)
  const entry = Number(p.entry_price)
  const qty = Number(p.qty)
  const margin = Number(p.margin || 0)
  if (![mark, entry, qty].every(Number.isFinite)) return { pnl: 0, roe: 0 }
  const raw = (mark - entry) * qty
  const pnl = p.side === 'short' ? -raw : raw
  const roe = margin > 0 ? (pnl / margin) * 100 : 0
  return { pnl, roe }
}

const maxVolumeText = computed(() => {
  if (!lastPrice.value) return '—'
  const max = (balance.value * leverage.value) / lastPrice.value
  return `${max.toFixed(6)}`
})

const coinUnit = computed(() => (symbol.value.startsWith('DOGE') ? 'DOGE' : symbol.value.startsWith('ETH') ? 'ETH' : 'BTC'))

const entryCalcPrice = computed(() => {
  if (orderType.value === 'limit' && Number.isFinite(limitPrice.value) && limitPrice.value > 0) return limitPrice.value
  return lastPrice.value ?? 0
})

const marginUsdt = computed(() => {
  const p = Math.max(0, Math.min(100, Number(percent.value || 0)))
  return (balance.value * p) / 100
})

const qtyText = computed(() => {
  const price = Number(entryCalcPrice.value || 0)
  const m = Number(marginUsdt.value || 0)
  const lev = Number(leverage.value || 1)
  if (!price || !m) return '0.0000'
  const qty = (m * lev) / price
  return qty.toFixed(coinUnit.value === 'DOGE' ? 2 : 6)
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

function clearEntryLines() {
  if (!candleSeries) return
  while (priceLines.length) {
    const pl = priceLines.pop()
    try {
      candleSeries.removePriceLine(pl)
    } catch {
      // ignore
    }
  }
}

function renderEntryLines() {
  if (!candleSeries) return
  clearEntryLines()
  for (const p of positions.value) {
    const price = Number(p.entry_price)
    if (!Number.isFinite(price)) continue
    const color = p.side === 'long' ? '#60a5fa' : '#fb7185'
    const title = `${p.side === 'long' ? 'LONG' : 'SHORT'} ${fmtPrice(price)}`
    const pl = candleSeries.createPriceLine({
      price,
      color,
      lineWidth: 2,
      axisLabelVisible: true,
      title
    })
    priceLines.push(pl)
  }
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

  // 데이터 갱신 후 진입 라인 다시 표시
  renderEntryLines()
}

async function reloadCandles() {
  await fetchCandles().catch(() => {})
}

function connectWs() {
  if (!process.client) return
  ws?.close()
  asks.value = []
  bids.value = []
  resetOrderbook()
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
          // 첨부처럼 더 많은 레벨이 필요해서 books 사용
          { channel: 'books', instId }
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

      if (arg.channel === 'books') {
        // snapshot/update 모두 처리 (수량 0은 제거)
        if (msg?.action === 'snapshot') {
          resetOrderbook()
        }

        applyOrderbookUpdate(data.asks, 'ask')
        applyOrderbookUpdate(data.bids, 'bid')

        if (msg?.action === 'snapshot') {
          initDisplayFromMaps()
        } else {
          refreshDisplayIfNeeded()
        }
      }
    } catch {
      // ignore
    }
  }
}

function reconnect() {
  connectWs()
}

const trades = ref<any[]>([])
const executions = ref<any[]>([])
const executionsLimit = 20
const executionsOffset = ref(0)
const hasMoreExecutions = ref(true)
const loadingExecutions = ref(false)

const isCloseModalOpen = ref(false)
const closeModalData = ref<any>(null)

function showCloseModal(data: any) {
  closeModalData.value = data
  isCloseModalOpen.value = true
}

function closeCloseModal() {
  isCloseModalOpen.value = false
  closeModalData.value = null
}

function calculateRoe(data: any) {
  const diff = data.side === 'long' 
    ? (data.exitPrice - data.entryPrice)
    : (data.entryPrice - data.exitPrice);
  const percent = (diff / data.entryPrice) * data.leverage * 100;
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
}

function formatPnlWon(pnl: number) {
  const krw = Math.round(pnl * 1400); // 1 USDT = 1400 KRW
  return `${krw >= 0 ? '+' : ''}${krw.toLocaleString()} WON`;
}

function formatSymbol(sym: string) {
  return sym.replace('-USDT-SWAP', '').replace('USDT', '') + '/USDT';
}

function formatTime(isoStr: string) {
  if (!isoStr) return '';
  return isoStr.replace('T', ' ').slice(0, 19);
}

async function loadExecutions(reset = false) {
  if (!me.value) return
  if (reset) {
    executionsOffset.value = 0
    executions.value = []
    hasMoreExecutions.value = true
  }
  if (!hasMoreExecutions.value || loadingExecutions.value) return

  loadingExecutions.value = true
  try {
    const data = await $fetch<any>('/api/executions', {
      query: { limit: executionsLimit, offset: executionsOffset.value }
    })
    if (data.executions.length < executionsLimit) {
      hasMoreExecutions.value = false
    }
    executions.value = [...executions.value, ...data.executions]
    executionsOffset.value += data.executions.length
  } catch (err) {
    console.error('Failed to load executions:', err)
  } finally {
    loadingExecutions.value = false
  }
}

function onExecutionsScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
    loadExecutions()
  }
}

function onSelectExecutionsTab() {
  bottomTab.value = 'executions'
  loadExecutions(true)
}

async function refreshActiveTab() {
  await loadAccount()
  if (bottomTab.value === 'executions') {
    await loadExecutions(true)
  }
}

async function loadAccount() {
  if (!me.value) return
  const data = await $fetch<any>('/api/account')
  balance.value = data.balance.usdt
  positions.value = data.positions
  trades.value = data.trades

  if (chartMode.value === 'built') {
    renderEntryLines()
  }
}

function selectOrderType(t: 'market' | 'limit' | 'trigger') {
  orderType.value = t
  tradeMsg.value = null
  error.value = null
  if (lastPrice.value) limitPrice.value = lastPrice.value

  // 비중 유지 및 로드
  if (percent.value <= 0 || percent.value > 100) {
    if (process.client) {
      const pctKey = me.value ? `futures_percent_${me.value.username}` : 'futures_percent'
      const savedPercent = localStorage.getItem(pctKey)
      if (savedPercent) {
        percent.value = parseInt(savedPercent) || 100
      } else {
        percent.value = 100
      }
    } else {
      percent.value = 100
    }
  }
}

async function onOpen(s: 'long' | 'short') {
  side.value = s
  await openPosition()
}

async function openPosition() {
  if (!me.value) return
  if (orderType.value === 'trigger') return

  const m = Number(marginUsdt.value)
  if (!Number.isFinite(m) || m <= 0) {
    error.value = '비중을 1~100%로 설정해주세요.'
    return
  }

  const price = Number(entryCalcPrice.value)
  if (!Number.isFinite(price) || price <= 0) {
    error.value = '가격 정보를 가져올 수 없습니다.'
    return
  }

  loading.value = true
  error.value = null
  tradeMsg.value = null
  try {
    await $fetch('/api/trade/open', {
      method: 'POST',
      body: {
        symbol: symbol.value,
        side: side.value,
        margin: m,
        leverage: leverage.value,
        ...(orderType.value === 'limit' ? { price } : {})
      }
    })
    tradeMsg.value = '포지션이 오픈되었습니다.'
    await loadAccount()

    // 비중을 유지합니다.
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
    showCloseModal(res)
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

watch(leverage, (v) => {
  if (process.client) {
    const key = me.value ? `futures_leverage_${me.value.username}` : 'futures_leverage'
    localStorage.setItem(key, v.toString())
  }
})

watch(percent, (v) => {
  if (process.client) {
    const key = me.value ? `futures_percent_${me.value.username}` : 'futures_percent'
    localStorage.setItem(key, v.toString())
  }
})

onMounted(async () => {
  initChart()
  if (chartMode.value === 'built') {
    await fetchCandles().catch(() => {})
  }
  connectWs()
  await loadAccount()

  // 초기값: 시장가 탭은 0%, 지정가는 100% (요구사항)
  selectOrderType(orderType.value)

  // 로컬스토리지에서 비중, 레버리지 값 복원 (유저 개별)
  if (process.client) {
    const levKey = me.value ? `futures_leverage_${me.value.username}` : 'futures_leverage'
    const pctKey = me.value ? `futures_percent_${me.value.username}` : 'futures_percent'
    const savedLeverage = localStorage.getItem(levKey)
    if (savedLeverage) {
      leverage.value = parseInt(savedLeverage) || 100
    }
    const savedPercent = localStorage.getItem(pctKey)
    if (savedPercent) {
      percent.value = parseInt(savedPercent) || 100
    }
  }
})

onBeforeUnmount(() => {
  ws?.close()
  ws = null
})
</script>

<style scoped>
/* Webkit (Chrome, Safari, Edge) */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00b075;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  transition: transform 0.1s ease;
}
input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* Firefox */
input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00b075;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  transition: transform 0.1s ease;
}
input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.2);
}
</style>
