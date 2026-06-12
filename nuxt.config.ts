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
      appName: 'Exchange Demo'
    }
  }
})
