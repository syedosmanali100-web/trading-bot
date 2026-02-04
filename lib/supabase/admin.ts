import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as User[]
  },

  // Get user by username
  async getUserByUsername(username: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data as User | null
  },

  // Get user by Deriv account ID
  async getUserByDerivId(derivAccountId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('deriv_account_id', derivAccountId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data as User | null
  },

  // Create new user
  async createUser(user: Partial<User>) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([user])
      .select()
      .single()
    
    if (error) throw error
    return data as User
  },

  // Update user
  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabaseAdmin
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
    const { error } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
      .from('deriv_trades')
      .insert([trade])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get user trades
  async getUserTrades(userId: string, limit = 50) {
    const { data, error } = await supabaseAdmin
      .from('deriv_trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }
}
