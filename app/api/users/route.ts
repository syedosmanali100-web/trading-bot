import { NextResponse } from 'next/server'
import { db } from '@/lib/supabase/admin'

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

// GET - Get all users
export async function GET() {
  try {
    const users = await db.getUsers()
    
    // Remove sensitive data
    const sanitizedUsers = users.map(u => ({
      ...u,
      password: undefined,
      deriv_token: undefined
    }))
    
    return NextResponse.json({ success: true, users: sanitizedUsers })
  } catch (error) {
    console.error('GET users error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { id, username, password, is_admin, is_active, subscription_end } = body
    
    if (!id || !username || !password || !subscription_end) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await db.getUserByUsername(username)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      )
    }
    
    const newUser = await db.createUser({
      id,
      username,
      password,
      is_admin: is_admin || false,
      is_active: is_active !== undefined ? is_active : true,
      subscription_end,
      is_deriv_user: false,
      created_at: new Date().toISOString()
    })
    
    console.log('User created:', username)
    
    // Remove sensitive data
    const sanitizedUser = { ...newUser, password: undefined, deriv_token: undefined }
    
    return NextResponse.json({ success: true, user: sanitizedUser })
  } catch (error) {
    console.error('POST user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }
    
    await db.deleteUser(id)
    console.log('User deleted:', id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

// PATCH - Toggle user status
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }
    
    const user = await db.toggleUserStatus(id)
    console.log('User status toggled:', id, user.is_active)
    
    // Remove sensitive data
    const sanitizedUser = { ...user, password: undefined, deriv_token: undefined }
    
    return NextResponse.json({ success: true, user: sanitizedUser })
  } catch (error) {
    console.error('PATCH user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
