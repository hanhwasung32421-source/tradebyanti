import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdminClient() {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabaseAnonKey as string
  // anon 키 기반: 데모용(보안상 production에서는 service role 권장)
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export async function supaInsert(table: string, payload: any) {
  try {
    const supa = getSupabaseAdminClient()
    const { error } = await supa.from(table).insert(payload as any)
    if (error) {
      console.warn('[supabase]', table, error.message)
    }
  } catch (e: any) {
    console.warn('[supabase]', table, e?.message || e)
  }
}

