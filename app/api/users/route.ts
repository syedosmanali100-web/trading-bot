import { NextResponse } from 'next/server';
import { getAllUsers, createUser, deleteUser, toggleUserStatus, initDatabase } from '@/lib/db';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// GET - Get all users
export async function GET() {
  try {
    await ensureDbInitialized();
    const users = await getAllUsers();
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
    await ensureDbInitialized();
    const body = await request.json();
    
    const { id, username, password, is_admin, is_active, subscription_end } = body;
    
    if (!id || !username || !password || !subscription_end) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await createUser({
      id,
      username,
      password,
      is_admin: is_admin || false,
      is_active: is_active !== undefined ? is_active : true,
      subscription_end
    });
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, user: result.user });
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
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }
    
    const result = await deleteUser(id);
    return NextResponse.json(result);
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
    await ensureDbInitialized();
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }
    
    const result = await toggleUserStatus(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('PATCH user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
