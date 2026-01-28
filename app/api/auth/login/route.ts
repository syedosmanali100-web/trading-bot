import { NextResponse } from 'next/server';
import { getUserByUsername, initDatabase } from '@/lib/db';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }
    
    // Get user from database
    const user = await getUserByUsername(username.trim());
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Check password
    if (user.password !== password.trim()) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Your subscription is not active. Please contact admin.' },
        { status: 403 }
      );
    }
    
    // Check subscription expiry
    const subscriptionEnd = new Date(user.subscription_end);
    const now = new Date();
    
    if (subscriptionEnd < now) {
      return NextResponse.json(
        { success: false, error: 'Your subscription has expired. Please contact admin.' },
        { status: 403 }
      );
    }
    
    // Return user session data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin,
        subscription_end: user.subscription_end
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
