<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const { me } = useMe()
let heartbeatTimer: any = null

onMounted(() => {
  // 1분(60초)마다 heartbeat 전송
  heartbeatTimer = setInterval(async () => {
    if (me.value) {
      await $fetch('/api/user/heartbeat', { method: 'POST' }).catch(() => {})
    }
  }, 60000)
  
  // 최초 진입 시에도 1회 전송
  if (me.value) {
    $fetch('/api/user/heartbeat', { method: 'POST' }).catch(() => {})
  }
})

onUnmounted(() => {
  if (heartbeatTimer) clearInterval(heartbeatTimer)
})
</script>
