import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return supabaseAdmin
}

// Database helper functions
export interface User {
  id: string
  username: string
  password: string
  is_admin: boolean
  is_active: boolean
  subscription_end: string
  created_at: string
  deriv_account_id?: string
  deriv_token?: string
  is_deriv_user: boolean
  referral_code?: string
  last_login?: string
  account_balance?: number
  total_trades?: number
}

export const db = {
  // Get all users
  async getUsers() {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as User[]
  },

  // Get user by username
  async getUserByUsername(username: string) {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data as User | null
  },

  // Get user by Deriv account ID
  async getUserByDerivId(derivAccountId: string) {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('users')
      .select('*')
      .eq('deriv_account_id', derivAccountId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data as User | null
  },

  // Create new user
  async createUser(user: Partial<User>) {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('users')
      .insert([user])
      .select()
      .single()
    
    if (error) throw error
    return data as User
  },

  // Update user
  async updateUser(id: string, updates: Partial<User>) {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as User
  },

  // Delete user
  async deleteUser(id: string) {
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Toggle user active status
  async toggleUserStatus(id: string) {
    const user = await this.getUserById(id)
    if (!user) throw new Error('User not found')
    
    return await this.updateUser(id, { is_active: !user.is_active })
  },

  // Get user by ID
  async getUserById(id: string) {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data as User | null
  },

  // Update last login
  async updateLastLogin(id: string) {
    return await this.updateUser(id, { last_login: new Date().toISOString() })
  },

  // Log trade
  async logTrade(trade: {
    user_id: string
    contract_id?: string
    asset: string
    trade_type: string
    stake: number
    payout?: number
    entry_price?: number
    exit_price?: number
    profit_loss?: number
    status?: string
  }) {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('deriv_trades')
      .insert([trade])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get user trades
  async getUserTrades(userId: string, limit = 50) {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('deriv_trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }
}
