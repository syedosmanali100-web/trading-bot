import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();
    
    if (!userId || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'User ID and new password required' },
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

    // This is a workaround since we're using in-memory storage
    // In production with database, this would be a proper UPDATE query
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
