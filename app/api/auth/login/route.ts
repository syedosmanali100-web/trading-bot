import { NextResponse } from 'next/server';

interface User {
  id: string;
  username: string;
  password: string;
  is_admin: boolean;
  is_active: boolean;
  subscription_end: string;
  created_at: string;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }
    
    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    // Get users from the users API
    const usersResponse = await fetch(`${baseUrl}/api/users`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!usersResponse.ok) {
      console.error('Failed to fetch users:', usersResponse.status);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    const usersData = await usersResponse.json();
    
    if (!usersData.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    const user = usersData.users.find((u: User) => 
      u.username.toLowerCase() === username.trim().toLowerCase()
    );
    
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
