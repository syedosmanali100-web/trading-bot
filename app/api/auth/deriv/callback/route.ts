import { NextResponse } from 'next/server'
import { db } from '@/lib/supabase/admin'
import { DerivAPIServer } from '@/lib/deriv/api'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const accounts = searchParams.get('accounts')
    const state = searchParams.get('state')
    
    if (!code || !accounts) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    // Parse accounts (Deriv returns token in accounts parameter)
    const accountList = JSON.parse(accounts)
    if (!accountList || accountList.length === 0) {
      return NextResponse.redirect(new URL('/login?error=no_accounts', request.url))
    }

    const derivAccount = accountList[0]
    const token = derivAccount.token
    const accountId = derivAccount.loginid

    // Verify token with Deriv API
    const derivAPI = new DerivAPIServer(token)
    const authResponse = await derivAPI.authorize()

    if (!authResponse.authorize) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Check if user already exists
    let user = await db.getUserByDerivId(accountId)

    if (!user) {
      // Create new user
      user = await db.createUser({
        id: `deriv-${accountId}`,
        username: authResponse.authorize.email || `${accountId}@deriv.user`,
        password: Math.random().toString(36).slice(-12), // Random password for Deriv users
        is_admin: false,
        is_active: true,
        subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year free
        deriv_account_id: accountId,
        deriv_token: token,
        is_deriv_user: true,
        referral_code: state || undefined,
        created_at: new Date().toISOString()
      })
    } else {
      // Update existing user's token
      user = await db.updateUser(user.id, {
        deriv_token: token,
        last_login: new Date().toISOString()
      })
    }

    // Prepare session data
    const sessionData = {
      userId: user.id,
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin,
      is_admin: user.is_admin,
      isDeriv: true,
      is_deriv_user: true,
      is_active: user.is_active,
      subscription_end: user.subscription_end
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('user_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Redirect directly to home page - session is already in cookie
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Deriv OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}
