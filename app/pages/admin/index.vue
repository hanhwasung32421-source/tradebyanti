<template>
  <div class="space-y-6 max-w-7xl mx-auto py-4">
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
          <thead class="text-slate-400 border-b border-white/10 whitespace-nowrap">
            <tr>
              <th class="py-3 px-2 font-semibold min-w-[40px]">ID</th>
              <th class="py-3 px-2 font-semibold min-w-[80px]">아이디</th>
              <th class="py-3 px-2 font-semibold min-w-[120px]">최근 접속/IP</th>
              <th class="py-3 px-2 font-semibold min-w-[80px]">상태</th>
              <th class="py-3 px-2 font-semibold min-w-[150px]">역할(권한 변경)</th>
              <th class="py-3 px-2 font-semibold min-w-[200px]">USDT 잔액 수정</th>
              <th class="py-3 px-2 font-semibold text-right min-w-[120px]">계정 관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-t border-white/5 hover:bg-white/5 transition">
              <td class="py-3 px-2 font-mono text-slate-400 whitespace-nowrap">{{ u.id }}</td>
              <td class="py-3 px-2 font-semibold text-slate-200 whitespace-nowrap">{{ u.username }}</td>
              <td class="py-3 px-2 text-xs whitespace-nowrap">
                <div v-if="u.last_login_at" class="text-slate-300">{{ new Date(u.last_login_at).toLocaleString() }}</div>
                <div v-else class="text-slate-500">기록 없음</div>
                <button v-if="u.last_login_ip" class="text-indigo-400 hover:text-indigo-300 hover:underline mt-1 focus:outline-none" @click="openIpDesk(u.last_login_ip)">{{ u.last_login_ip }}</button>
                <div v-else class="text-slate-400 mt-1">IP 없음</div>
              </td>
              <td class="py-3 px-2 whitespace-nowrap">
                <div v-if="isOnline(u.last_seen_at)" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  온라인
                </div>
                <div v-else class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[11px] font-bold">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  오프라인
                </div>
              </td>
              <td class="py-3 px-2 whitespace-nowrap">
                <select 
                  v-model="u.role" 
                  @change="updateRole(u.id, u.role)" 
                  class="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-sans cursor-pointer min-w-[130px]"
                  :disabled="u.username === 'admin' || (me?.role !== 'super_admin' && u.role === 'super_admin')"
                >
                  <option value="user" class="bg-[#0f1423] text-slate-200 font-sans">일반 유저 (user)</option>
                  <option value="branch_admin" class="bg-[#0f1423] text-slate-200 font-sans">부어드민 (branch_admin)</option>
                  <option value="super_admin" class="bg-[#0f1423] text-slate-200 font-sans" :disabled="me?.role !== 'super_admin'">최고관리자 (super_admin)</option>
                </select>
              </td>
              <td class="py-3 px-2 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-slate-300 w-16 text-right">{{ (u.usdt ?? 0).toFixed(2) }}</span>
                  <input
                    v-model.number="balanceInputs[u.id]"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-24 rounded-lg bg-[#e8efff] text-slate-900 px-2 py-1.5 text-xs font-semibold font-mono border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <button class="rounded-lg bg-[#5352ed] hover:bg-[#3d3ce3] text-white px-2 py-1.5 text-xs font-bold transition shadow-sm whitespace-nowrap" @click="modifyBalance(u.id)">
                    수정
                  </button>
                </div>
              </td>
              <td class="py-3 px-2 text-right space-x-2 whitespace-nowrap">
                <button class="rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-1.5 text-[11px] border border-indigo-500/30 transition whitespace-nowrap" @click="openUserInfoDesk(u)">정보 수정</button>
                <button class="rounded bg-red-600 hover:bg-red-500 text-white px-2 py-1.5 text-[11px] font-bold transition shadow whitespace-nowrap" @click="deleteUser(u.id, u.username)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="error" class="mt-3 text-sm text-red-300 font-medium">{{ error }}</p>
    </div>

    <!-- IP 차단 컨트롤 데스크 모달 -->
    <div v-if="ipDesk.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-[#0f1423] border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-sm">
        <h3 class="text-lg font-bold text-white mb-2">IP 컨트롤 데스크</h3>
        <div class="mb-6 p-3 rounded-lg bg-white/5 border border-white/5">
          <p class="text-xs text-slate-400 mb-1">대상 IP</p>
          <p class="text-lg font-mono font-bold text-slate-200">{{ ipDesk.ip }}</p>
        </div>
        <p class="text-sm text-slate-300 mb-6 leading-relaxed">
          이 IP를 차단하면 해당 인터넷 환경에서 시도하는 모든 로그인 및 회원가입이 서버단에서 완전히 거부됩니다.
        </p>
        <div class="flex gap-3 justify-end">
          <button class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-white/10 transition" @click="ipDesk.show = false">취소</button>
          <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/20" @click="executeIpBlock">차단하기</button>
          <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20" @click="executeIpUnblock">차단 해제</button>
        </div>
      </div>
    </div>

    <!-- 유저 정보 수정 모달 -->
    <div v-if="userInfoDesk.show && userInfoDesk.user" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-[#0f1423] border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-white mb-4">유저 정보 수정 <span class="text-sm font-mono text-indigo-400">({{ userInfoDesk.user.username }})</span></h3>
        
        <form @submit.prevent="saveUserInfo" class="space-y-4">
          <div>
            <label class="text-xs text-slate-400 block mb-1">비밀번호 변경 (비워두면 유지)</label>
            <input v-model="userInfoDesk.form.password" type="password" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="새 비밀번호" />
          </div>
          <div>
            <label class="text-xs text-slate-400 block mb-1">이름</label>
            <input v-model="userInfoDesk.form.real_name" type="text" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="text-xs text-slate-400 block mb-1">전화번호</label>
            <input v-model="userInfoDesk.form.phone" type="text" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="text-xs text-slate-400 block mb-1">생년월일 (나이)</label>
            <input v-model="userInfoDesk.form.birthdate" type="date" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-400 block mb-1">은행명</label>
              <input v-model="userInfoDesk.form.bank_name" type="text" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="text-xs text-slate-400 block mb-1">계좌번호</label>
              <input v-model="userInfoDesk.form.bank_account" type="text" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div class="flex gap-3 justify-end mt-6 pt-4 border-t border-white/10">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-white/10 transition" @click="userInfoDesk.show = false">취소</button>
            <button type="submit" class="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20" :disabled="userInfoDesk.saving">
              {{ userInfoDesk.saving ? '저장 중...' : '저장하기' }}
            </button>
          </div>
        </form>
      </div>
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
  real_name?: string;
  phone?: string;
  birthdate?: string;
  bank_name?: string;
  bank_account?: string;
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

const ipDesk = reactive({ show: false, ip: '' })

function openIpDesk(ip: string) {
  ipDesk.ip = ip
  ipDesk.show = true
}

async function executeIpBlock() {
  if (!confirm(`해당 IP(${ipDesk.ip})를 차단하시겠습니까?\n차단된 IP는 즉시 사이트 로그인 및 가입이 불가능해집니다.`)) return
  try {
    await $fetch('/api/admin/users/block-ip', { method: 'POST', body: { ip: ipDesk.ip, block: true } })
    alert(`[${ipDesk.ip}] IP 차단이 완료되었습니다.`)
    ipDesk.show = false
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'IP 차단에 실패했습니다.')
  }
}

async function executeIpUnblock() {
  if (!confirm(`해당 IP(${ipDesk.ip})의 차단을 해제하시겠습니까?`)) return
  try {
    await $fetch('/api/admin/users/block-ip', { method: 'POST', body: { ip: ipDesk.ip, block: false } })
    alert(`[${ipDesk.ip}] IP 차단이 해제되었습니다.`)
    ipDesk.show = false
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'IP 차단 해제에 실패했습니다.')
  }
}

const userInfoDesk = reactive({
  show: false,
  saving: false,
  user: null as AdminUserRow | null,
  form: { password: '', real_name: '', phone: '', birthdate: '', bank_name: '', bank_account: '' }
})

function openUserInfoDesk(u: AdminUserRow) {
  userInfoDesk.user = u
  userInfoDesk.form = {
    password: '',
    real_name: u.real_name || '',
    phone: u.phone || '',
    birthdate: u.birthdate || '',
    bank_name: u.bank_name || '',
    bank_account: u.bank_account || ''
  }
  userInfoDesk.show = true
}

async function saveUserInfo() {
  if (!userInfoDesk.user) return
  userInfoDesk.saving = true
  try {
    await $fetch('/api/admin/users/update-info', {
      method: 'POST',
      body: { id: userInfoDesk.user.id, ...userInfoDesk.form }
    })
    alert('유저 정보가 수정되었습니다.')
    userInfoDesk.show = false
    await load()
  } catch (e: any) {
    alert(e?.data?.statusMessage || '정보 수정에 실패했습니다.')
  } finally {
    userInfoDesk.saving = false
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
