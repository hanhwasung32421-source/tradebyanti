// https://nuxt.com/docs/api/configuration/nuxt-config
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
      supabaseUrl: process.env.SUPABASE_URL || 'https://dyfycrmltqosezmsufup.supabase.co',
      supabaseAnonKey:
        process.env.SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Znljcm1sdHFvc2V6bXN1ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzg4MDIsImV4cCI6MjA5NTYxNDgwMn0.VpJCBdD1g8YZiaa6Zah9ZKIu3ydu_RkSgWCdEXe2QGw'
    }
  }
})
