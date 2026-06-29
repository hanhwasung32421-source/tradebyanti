// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { execSync } from 'node:child_process'

function getAppVersion() {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  
  try {
    const build = execSync('git rev-list --count HEAD').toString().trim()
    return `${yy}${mm}${dd}.${build}`
  } catch {
    return `${yy}${mm}${dd}.0`
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // 서버 전용
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    public: {
      appName: 'UsdtFuture',
      appVersion: process.env.APP_VERSION || getAppVersion(),
      supabaseUrl: process.env.SUPABASE_URL || 'https://dyfycrmltqosezmsufup.supabase.co',
      supabaseAnonKey:
        process.env.SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Znljcm1sdHFvc2V6bXN1ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzg4MDIsImV4cCI6MjA5NTYxNDgwMn0.VpJCBdD1g8YZiaa6Zah9ZKIu3ydu_RkSgWCdEXe2QGw'
    }
  }
})
