// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function getAppVersion() {
  try {
    const raw = readFileSync(join(process.cwd(), 'version.json'), 'utf8')
    // Windows PowerShell이 UTF-8 BOM을 붙이는 경우가 있어 제거
    const cleaned = raw.replace(/^\uFEFF/, '')
    const v = JSON.parse(cleaned)
    if (v?.date && v?.build) return `${v.date}.${v.build}`
  } catch {
    // ignore
  }
  // fallback: yyMMdd.0
  const d = new Date()
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}${mm}${dd}.0`
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
      appName: 'Exchange Demo',
      appVersion: process.env.APP_VERSION || getAppVersion(),
      supabaseUrl: process.env.SUPABASE_URL || 'https://axcppzioyedwfvtvmilr.supabase.co',
      supabaseAnonKey:
        process.env.SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y3BwemlveWVkd2Z2dHZtaWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDE0ODAsImV4cCI6MjA5NTYxNzQ4MH0.R2dcCJoyBxgW6dzUSP0j8eJX3fMzCBxynda-AKu6aaw'
    }
  }
})
