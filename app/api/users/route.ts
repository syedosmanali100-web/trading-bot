import { NextResponse } from 'next/server';

export interface User {
  id: string;
  username: string;
  password: string;
  is_admin: boolean;
  is_active: boolean;
  subscription_end: string;
  created_at: string;
}

// Simple in-memory storage for development
// In production, this will be replaced by database
let users: User[] = [
  {
    id: 'admin-001',
    username: 'admin@nexus.com',
    password: 'admin123',
    is_admin: true,
    is_active: true,
    subscription_end: '2099-12-31T00:00:00.000Z',
    created_at: new Date().toISOString()
  }
];

// GET - Get all users
export async function GET() {
  try {
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { id, username, password, is_admin, is_active, subscription_end } = body;
    
    if (!id || !username || !password || !subscription_end) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      );
    }
    
    const newUser: User = {
      id,
      username,
      password,
      is_admin: is_admin || false,
      is_active: is_active !== undefined ? is_active : true,
      subscription_end,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    console.log('User created:', username);
    
    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('POST user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }
    
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users.splice(index, 1);
      console.log('User deleted:', id);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle user status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }
    
    const user = users.find(u => u.id === id);
    if (user) {
      user.is_active = !user.is_active;
      console.log('User status toggled:', id, user.is_active);
      return NextResponse.json({ success: true, user });
    }
    
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('PATCH user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
