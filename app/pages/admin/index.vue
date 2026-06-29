<template>
  <div class="space-y-6 max-w-4xl mx-auto py-4">
    <!-- 대시보드 상단 헤더 & 정보 -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#0f1423] p-6 shadow-xl">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-white">관리자 대시보드</h1>
        <p class="mt-1 text-sm text-slate-400">
          현재 계정: <span class="font-mono font-semibold text-slate-200">{{ me?.username }} ({{ me?.role }})</span>
        </p>
      </div>
      <div v-if="me?.role === 'super_admin'">
        <NuxtLink to="/admin/create-account" class="inline-block rounded-lg bg-[#5352ed] hover:bg-[#3d3ce3] text-white px-4 py-2.5 text-sm font-semibold transition shadow-md border border-white/5">
          지사(관리자) 계정 생성
        </NuxtLink>
      </div>
    </div>

    <!-- 유저 및 권한 관리 (대시보드에 바로 노출) -->
    <div class="rounded-2xl border border-white/5 bg-[#0f1423] p-6 shadow-xl">
      <div class="flex items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
        <div>
          <h2 class="text-lg font-bold text-white">유저 및 권한 관리</h2>
          <p class="text-xs text-slate-400 mt-0.5">사용자 역할 설정 및 가상 USDT 잔고를 직접 변경할 수 있습니다.</p>
        </div>
        <button class="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15 transition border border-white/5" @click="load">
          새로고침
        </button>
      </div>

      <div v-if="loading" class="text-sm text-slate-400 py-4 text-center">불러오는 중…</div>
      <div v-else class="overflow-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-slate-400 border-b border-white/10">
            <tr>
              <th class="py-3 px-2 font-semibold">ID</th>
              <th class="py-3 px-2 font-semibold">아이디</th>
              <th class="py-3 px-2 font-semibold">최근 접속/IP</th>
              <th class="py-3 px-2 font-semibold">상태</th>
              <th class="py-3 px-2 font-semibold">역할(권한 변경)</th>
              <th class="py-3 px-2 font-semibold">USDT 잔액 수정</th>
              <th class="py-3 px-2 font-semibold text-right">계정 관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-t border-white/5 hover:bg-white/5 transition">
              <td class="py-3 px-2 font-mono text-slate-400">{{ u.id }}</td>
              <td class="py-3 px-2 font-semibold text-slate-200">{{ u.username }}</td>
              <td class="py-3 px-2 text-xs">
                <div v-if="u.last_login_at" class="text-slate-300">{{ new Date(u.last_login_at).toLocaleString() }}</div>
                <div v-else class="text-slate-500">기록 없음</div>
                <div class="text-slate-400 mt-1">{{ u.last_login_ip || 'IP 없음' }}</div>
              </td>
              <td class="py-3 px-2">
                <div v-if="isOnline(u.last_seen_at)" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  온라인
                </div>
                <div v-else class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[11px] font-bold">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  오프라인
                </div>
              </td>
              <td class="py-3 px-2">
                <select 
                  v-model="u.role" 
                  @change="updateRole(u.id, u.role)" 
                  class="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-sans cursor-pointer"
                  :disabled="u.username === 'admin' || (me?.role !== 'super_admin' && u.role === 'super_admin')"
                >
                  <option value="user" class="bg-[#0f1423] text-slate-200 font-sans">일반 유저 (user)</option>
                  <option value="branch_admin" class="bg-[#0f1423] text-slate-200 font-sans">부어드민 (branch_admin)</option>
                  <option value="super_admin" class="bg-[#0f1423] text-slate-200 font-sans" :disabled="me?.role !== 'super_admin'">최고관리자 (super_admin)</option>
                </select>
              </td>
              <td class="py-3 px-2">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-slate-300 w-16 text-right">{{ (u.usdt ?? 0).toFixed(2) }}</span>
                  <input
                    v-model.number="balanceInputs[u.id]"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-28 rounded-lg bg-[#e8efff] text-slate-900 px-3 py-1.5 text-xs font-semibold font-mono border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <button class="rounded-lg bg-[#5352ed] hover:bg-[#3d3ce3] text-white px-3 py-1.5 text-xs font-bold transition shadow-sm" @click="modifyBalance(u.id)">
                    수정
                  </button>
                </div>
              </td>
              <td class="py-3 px-2 text-right space-x-2 whitespace-nowrap">
                <button v-if="u.last_login_ip" class="rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 px-2 py-1 text-[11px] border border-rose-500/30 transition" @click="blockIp(u.last_login_ip)">IP 차단</button>
                <button class="rounded bg-red-600 hover:bg-red-500 text-white px-2 py-1 text-[11px] font-bold transition shadow" @click="deleteUser(u.id, u.username)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="error" class="mt-3 text-sm text-red-300 font-medium">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const { me, refresh } = useMe()
await refresh()

type AdminUserRow = { 
  id: number; 
  username: string; 
  role: string; 
  usdt: number; 
  created_at: string;
  last_login_at?: string;
  last_login_ip?: string;
  last_seen_at?: string;
}

const users = ref<AdminUserRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const balanceInputs = reactive<Record<number, number>>({})

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await $fetch<{ users: AdminUserRow[] }>('/api/admin/users')
    users.value = data.users
    
    // 초기 잔고 값을 입력 인풋에 바인딩
    for (const u of data.users) {
      balanceInputs[u.id] = parseFloat((u.usdt ?? 0).toFixed(2))
    }
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '불러오기 실패'
  } finally {
    loading.value = false
  }
}

async function updateRole(userId: number, role: string) {
  error.value = null
  try {
    await $fetch('/api/admin/users/update-role', { method: 'POST', body: { userId, role } })
    await load()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '권한(역할) 변경에 실패했습니다.'
  }
}

async function modifyBalance(userId: number) {
  error.value = null
  const amount = Number(balanceInputs[userId])
  if (Number.isNaN(amount) || amount < 0) {
    error.value = '올바른 잔고 값을 입력해주세요.'
    return
  }
  try {
    await $fetch('/api/admin/users/update-balance', { method: 'POST', body: { userId, amount } })
    await load()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '잔고 수정에 실패했습니다.'
  }
}

function isOnline(lastSeen?: string) {
  if (!lastSeen) return false
  const diff = Date.now() - new Date(lastSeen).getTime()
  return diff < 3 * 60 * 1000 // 3분 이내면 온라인
}

async function blockIp(ip: string) {
  if (!confirm(`해당 IP(${ip})를 정말 차단하시겠습니까?\n차단된 IP는 즉시 사이트 로그인이 불가능해집니다.`)) return
  try {
    await $fetch('/api/admin/users/block-ip', { method: 'POST', body: { ip, block: true } })
    alert(`[${ip}] IP 차단이 완료되었습니다.`)
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'IP 차단에 실패했습니다.')
  }
}

async function deleteUser(id: number, username: string) {
  if (username === 'admin') {
    alert('최고 관리자 계정은 삭제할 수 없습니다.')
    return
  }
  if (!confirm(`정말 유저 '${username}'을(를) 삭제하시겠습니까?\n가상 잔고 및 거래 내역 등 모든 관련 데이터가 영구히 삭제되며 복구할 수 없습니다.`)) return
  try {
    await $fetch('/api/admin/users/delete', { method: 'POST', body: { id } })
    alert('삭제되었습니다.')
    await load()
  } catch (e: any) {
    alert(e?.data?.statusMessage || '유저 삭제에 실패했습니다.')
  }
}

let onlineTimer: any = null
onMounted(() => {
  onlineTimer = setInterval(() => {
    // 1분마다 테이블 리렌더링 트리거하여 온라인 상태 실시간 반영
    users.value = [...users.value]
  }, 60000)
})
onUnmounted(() => {
  if (onlineTimer) clearInterval(onlineTimer)
})

await load()
</script>
