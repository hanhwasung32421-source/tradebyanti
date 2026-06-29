<template>
  <div class="mx-auto max-w-md">
    <h1 class="text-xl font-semibold">회원가입</h1>
    <p class="mt-1 text-sm text-slate-400">메인 사이트 가입</p>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <div>
        <label class="text-sm text-slate-300">아이디 *</label>
        <input v-model.trim="username" class="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-500" />
        <p class="mt-1 text-xs text-slate-500">2~20자</p>
      </div>
      <div>
        <label class="text-sm text-slate-300">비밀번호 *</label>
        <input v-model="password" type="password" class="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-500" />
        <p class="mt-1 text-xs text-slate-500">4자 이상</p>
      </div>
      <div>
        <label class="text-sm text-slate-300">이름 *</label>
        <input v-model.trim="real_name" class="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-500" placeholder="홍길동" />
      </div>
      <div>
        <label class="text-sm text-slate-300">전화번호 *</label>
        <input v-model.trim="phone" class="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-500" placeholder="010-1234-5678" />
      </div>
      <div>
        <label class="text-sm text-slate-300">생년월일 (나이)</label>
        <input v-model="birthdate" type="date" class="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-500 text-slate-200" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-sm text-slate-300">은행</label>
          <input v-model.trim="bank_name" class="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-500" placeholder="국민은행" />
        </div>
        <div>
          <label class="text-sm text-slate-300">계좌번호</label>
          <input v-model.trim="bank_account" class="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-500" placeholder="123-456-7890" />
        </div>
      </div>
      
      <button class="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400" :disabled="loading">
        가입하기
      </button>
      <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
    </form>

    <div class="mt-4 text-sm text-slate-400">
      이미 계정이 있나요?
      <NuxtLink to="/auth/login" class="text-indigo-300 hover:underline">로그인</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { refresh } = useMe()

const username = ref('')
const password = ref('')
const real_name = ref('')
const phone = ref('')
const birthdate = ref('')
const bank_name = ref('')
const bank_account = ref('')

const loading = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  loading.value = true
  error.value = null
  try {
    await $fetch('/api/auth/register', { 
      method: 'POST', 
      body: { 
        username: username.value, 
        password: password.value,
        real_name: real_name.value,
        phone: phone.value,
        birthdate: birthdate.value,
        bank_name: bank_name.value,
        bank_account: bank_account.value
      } 
    })
    await refresh()
    await navigateTo('/exchange/BTCUSDT')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

