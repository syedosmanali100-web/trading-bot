import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Get user session from cookies
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)
    
    // Get user from database
    const user = await db.getUserById(session.userId)
    
    if (!user || !user.deriv_token) {
      return NextResponse.json(
        { success: false, error: 'Deriv account not linked' },
        { status: 400 }
      )
    }

    // Connect to Deriv API using WebSocket
    const connection = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=124906')
    
    return new Promise((resolve) => {
      let accountData: any = null
      let balanceData: any = null
      let receivedAuth = false
      let receivedBalance = false

      connection.onopen = () => {
        // Authorize with user's token
        connection.send(JSON.stringify({
          authorize: user.deriv_token
        }))
      }

      connection.onmessage = (msg) => {
        const data = JSON.parse(msg.data)
        
        if (data.error) {
          connection.close()
          resolve(NextResponse.json(
            { success: false, error: data.error.message },
            { status: 400 }
          ))
          return
        }

        if (data.authorize) {
          accountData = data.authorize
          receivedAuth = true
          
          // Get balance after authorization
          connection.send(JSON.stringify({
            balance: 1,
            subscribe: 0
          }))
        }

        if (data.balance) {
          balanceData = data.balance
          receivedBalance = true
        }

        // Once we have both auth and balance data, respond
        if (receivedAuth && receivedBalance) {
          connection.close()
          
          // Update user data in database
          db.updateUser(user.id, {
            account_balance: parseFloat(balanceData.balance),
            last_login: new Date().toISOString()
          })
          
          resolve(NextResponse.json({
            success: true,
            account: {
              loginid: accountData.loginid,
              email: accountData.email,
              fullname: accountData.fullname || accountData.email?.split('@')[0] || 'Trader',
              currency: accountData.currency,
              balance: parseFloat(balanceData.balance),
              country: accountData.country,
              is_virtual: accountData.is_virtual || 0
            }
          }))
        }
      }

      connection.onerror = (error) => {
        connection.close()
        resolve(NextResponse.json(
          { success: false, error: 'Failed to connect to Deriv' },
          { status: 500 }
        ))
      }

      // Timeout after 10 seconds
      setTimeout(() => {
        if (connection.readyState !== WebSocket.CLOSED) {
          connection.close()
          resolve(NextResponse.json(
            { success: false, error: 'Connection timeout' },
            { status: 504 }
          ))
        }
      }, 10000)
    })
  } catch (error) {
    console.error('Deriv account error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
