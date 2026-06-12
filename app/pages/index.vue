<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 class="text-2xl font-semibold">모의 선물거래 데모</h1>
      <p class="mt-2 text-slate-300">
        OKX 공개 시세를 기반으로 차트/호가를 보여주고, 가상 USDT로 모의체결을 할 수 있는 형태로 구성합니다.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <NuxtLink to="/exchange/BTCUSDT" class="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400">
          BTCUSDT 거래 화면
        </NuxtLink>
        <NuxtLink to="/profit" class="rounded-md bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15">
          수익인증 페이지
        </NuxtLink>
        <NuxtLink to="/admin" class="rounded-md bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15">
          관리자 페이지
        </NuxtLink>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="text-sm text-slate-400">기본 계정</div>
        <div class="mt-1 font-medium">메인: 가입/로그인 가능</div>
        <div class="mt-2 text-xs text-slate-400">관리자: 로그인만 가능</div>
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="text-sm text-slate-400">가상 입금</div>
        <div class="mt-1 font-medium">관리자가 유저에게 USDT 가상 입금</div>
        <div class="mt-2 text-xs text-slate-400">실제 온체인 입금 기능은 포함하지 않음</div>
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="text-sm text-slate-400">Supabase 저장</div>
        <div class="mt-1 font-medium">가입/로그인/매수/입금 기록을 Supabase에 복제 저장</div>
        <div class="mt-2 text-xs text-slate-400">`SUPABASE_EXTRA_TABLES.sql` 먼저 실행</div>
      </div>
    </section>
  </div>
</template>

