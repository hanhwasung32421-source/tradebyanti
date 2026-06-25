import { getSupabaseAdminClient } from './supabase'
import bcrypt from 'bcryptjs'

export function isoPlusDays(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString()
}

export async function getDbUser(username: string) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('users').select('*').eq('username', username).maybeSingle()
  if (error) throw error
  return data
}

export async function getDbUserById(id: number) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('users').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createDbUser(username: string, passwordHash: string, role: string, permissions: string) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('users').insert({
    username,
    password_hash: passwordHash,
    role,
    permissions,
    created_at: new Date().toISOString()
  }).select('id').single()
  if (error) throw error
  return data
}

export async function updateDbUserRole(id: number, role: string, permissions: string) {
  const supa = getSupabaseAdminClient()
  const { error } = await supa.from('users').update({ role, permissions }).eq('id', id)
  if (error) throw error
}

export async function getUsersAndBalances() {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('users').select(`
    id,
    username,
    role,
    created_at,
    balances:balances(usdt)
  `).order('id', { ascending: false })
  if (error) throw error
  return (data || []).map((u: any) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    created_at: u.created_at,
    usdt: u.balances?.usdt ?? 0
  }))
}

export async function createDbSession(token: string, userId: number, expiresAt: string) {
  const supa = getSupabaseAdminClient()
  const { error } = await supa.from('sessions').insert({
    token,
    user_id: userId,
    expires_at: expiresAt,
    created_at: new Date().toISOString()
  })
  if (error) throw error
}

export async function deleteDbSession(token: string) {
  const supa = getSupabaseAdminClient()
  const { error } = await supa.from('sessions').delete().eq('token', token)
  if (error) throw error
}

export async function getSessionUserByToken(token: string) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('sessions').select(`
    expires_at,
    users:users(id, username, role, permissions)
  `).eq('token', token).maybeSingle()
  if (error) throw error
  if (!data || !data.users) return null
  
  // Check if session has expired
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return null
  }
  
  const u = data.users as any
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    permissions: JSON.parse(u.permissions || '{}')
  }
}

export async function getDbBalance(userId: number) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('balances').select('usdt').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.usdt ?? 0
}

export async function ensureDbBalanceExists(userId: number) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('balances').select('usdt').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) {
    const { error: insError } = await supa.from('balances').insert({ user_id: userId, usdt: 0 })
    if (insError) throw insError
  }
}

export async function updateDbBalance(userId: number, amount: number) {
  const supa = getSupabaseAdminClient()
  await ensureDbBalanceExists(userId)
  const { error } = await supa.from('balances').update({ usdt: amount }).eq('user_id', userId)
  if (error) throw error
}

export async function incrementDbBalance(userId: number, amount: number) {
  const supa = getSupabaseAdminClient()
  await ensureDbBalanceExists(userId)
  const current = await getDbBalance(userId)
  const { error } = await supa.from('balances').update({ usdt: current + amount }).eq('user_id', userId)
  if (error) throw error
}

export async function getDbPositions(userId: number) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('positions').select('*').eq('user_id', userId).order('id', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getDbPositionById(id: number, userId: number) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('positions').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function createDbPosition(userId: number, symbol: string, side: string, qty: number, entryPrice: number, leverage: number, margin: number) {
  const supa = getSupabaseAdminClient()
  const { error } = await supa.from('positions').insert({
    user_id: userId,
    symbol: symbol.toUpperCase(),
    side,
    qty,
    entry_price: entryPrice,
    leverage,
    margin,
    created_at: new Date().toISOString()
  })
  if (error) throw error
}

export async function deleteDbPosition(id: number, userId: number) {
  const supa = getSupabaseAdminClient()
  const { error } = await supa.from('positions').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function getDbTrades(userId: number, limit = 50) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('trades').select('*').eq('user_id', userId).order('id', { ascending: false }).limit(limit)
  if (error) throw error
  return data || []
}

export async function getDbTradeById(id: number, userId: number) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('trades').select('id').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function createDbTrade(userId: number, symbol: string, side: string, qty: number, entryPrice: number, exitPrice: number, leverage: number, pnl: number) {
  const supa = getSupabaseAdminClient()
  const { error } = await supa.from('trades').insert({
    user_id: userId,
    symbol,
    side,
    qty,
    entry_price: entryPrice,
    exit_price: exitPrice,
    leverage,
    pnl,
    created_at: new Date().toISOString()
  })
  if (error) throw error
}

export async function getDbExecutions(userId: number, limit = 20, offset = 0) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('executions')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data || []
}

export async function createDbExecution(userId: number, symbol: string, side: string, price: number, qty: number, fee: number, pnl: number) {
  const supa = getSupabaseAdminClient()
  const { error } = await supa.from('executions').insert({
    user_id: userId,
    symbol,
    side,
    price,
    qty,
    fee,
    pnl,
    created_at: new Date().toISOString()
  })
  if (error) throw error
}

export async function getDbProfitCards(userId: number, limit = 50) {
  const supa = getSupabaseAdminClient()
  const { data, error } = await supa.from('profit_cards').select(`
    id,
    title,
    note,
    created_at,
    trades:trades(symbol, side, qty, pnl, entry_price, exit_price)
  `).eq('user_id', userId).order('id', { ascending: false }).limit(limit)
  
  if (error) throw error
  return (data || []).map((pc: any) => ({
    id: pc.id,
    title: pc.title,
    note: pc.note,
    created_at: pc.created_at,
    symbol: pc.trades?.symbol,
    side: pc.trades?.side,
    qty: pc.trades?.qty,
    pnl: pc.trades?.pnl,
    entry_price: pc.trades?.entry_price,
    exit_price: pc.trades?.exit_price
  }))
}

export async function createDbProfitCard(userId: number, tradeId: number, title: string, note: string) {
  const supa = getSupabaseAdminClient()
  const { error } = await supa.from('profit_cards').insert({
    user_id: userId,
    trade_id: tradeId,
    title,
    note,
    created_at: new Date().toISOString()
  })
  if (error) throw error
}

export async function seedAdmin() {
  try {
    const supa = getSupabaseAdminClient()
    const passwordHash = bcrypt.hashSync('1053', 10)
    
    const { data: existing, error: findError } = await supa.from('users').select('id').eq('username', 'admin').maybeSingle()
    if (findError) {
      console.warn('[Supabase Seeding Error]', findError.message)
      return
    }
    
    let adminId: number
    if (!existing) {
      const { data: inserted, error: insertError } = await supa.from('users').insert({
        username: 'admin',
        password_hash: passwordHash,
        role: 'super_admin',
        permissions: JSON.stringify({ all: true, canCredit: true }),
        created_at: new Date().toISOString()
      }).select('id').single()
      
      if (insertError) {
        console.warn('[Supabase Seeding Error]', insertError.message)
        return
      }
      adminId = inserted.id
    } else {
      adminId = existing.id
      const { error: updateError } = await supa.from('users').update({
        password_hash: passwordHash,
        role: 'super_admin'
      }).eq('id', adminId)
      
      if (updateError) {
        console.warn('[Supabase Seeding Error]', updateError.message)
      }
    }
    
    const { data: balance, error: balError } = await supa.from('balances').select('usdt').eq('user_id', adminId).maybeSingle()
    if (balError) return
    
    const seedAdminUsdt = Number(process.env.SEED_ADMIN_USDT ?? '10000')
    if (!balance) {
      await supa.from('balances').insert({ user_id: adminId, usdt: seedAdminUsdt })
    } else if (balance.usdt < seedAdminUsdt) {
      await supa.from('balances').update({ usdt: seedAdminUsdt }).eq('user_id', adminId)
    }
  } catch (e: any) {
    console.warn('[Supabase Seeding Catch]', e?.message || e)
  }
}
