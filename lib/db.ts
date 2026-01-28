import { sql } from '@vercel/postgres';

export interface User {
  id: string;
  username: string;
  password: string;
  is_admin: boolean;
  is_active: boolean;
  subscription_end: string;
  created_at: string;
}

// Initialize database tables
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        subscription_end TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create default admin user if not exists
    const adminExists = await sql`
      SELECT * FROM users WHERE username = 'admin@nexus.com'
    `;
    
    if (adminExists.rows.length === 0) {
      await sql`
        INSERT INTO users (id, username, password, is_admin, is_active, subscription_end, created_at)
        VALUES (
          'admin-001',
          'admin@nexus.com',
          'admin123',
          true,
          true,
          '2099-12-31',
          CURRENT_TIMESTAMP
        )
      `;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error };
  }
}

// Get all users
export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await sql`
      SELECT * FROM users ORDER BY created_at DESC
    `;
    return result.rows as User[];
  } catch (error) {
    console.error('Get users error:', error);
    return [];
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE LOWER(username) = LOWER(${username})
    `;
    return result.rows[0] as User || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Create new user
export async function createUser(user: Omit<User, 'created_at'>): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Check if user already exists
    const existing = await getUserByUsername(user.username);
    if (existing) {
      return { success: false, error: 'User already exists' };
    }
    
    const result = await sql`
      INSERT INTO users (id, username, password, is_admin, is_active, subscription_end)
      VALUES (${user.id}, ${user.username}, ${user.password}, ${user.is_admin}, ${user.is_active}, ${user.subscription_end})
      RETURNING *
    `;
    
    return { success: true, user: result.rows[0] as User };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

// Update user
export async function updateUser(id: string, updates: Partial<User>): Promise<{ success: boolean; user?: User }> {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updates.username !== undefined) {
      setClauses.push(`username = $${paramIndex++}`);
      values.push(updates.username);
    }
    if (updates.password !== undefined) {
      setClauses.push(`password = $${paramIndex++}`);
      values.push(updates.password);
    }
    if (updates.is_admin !== undefined) {
      setClauses.push(`is_admin = $${paramIndex++}`);
      values.push(updates.is_admin);
    }
    if (updates.is_active !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(updates.is_active);
    }
    if (updates.subscription_end !== undefined) {
      setClauses.push(`subscription_end = $${paramIndex++}`);
      values.push(updates.subscription_end);
    }
    
    if (setClauses.length === 0) {
      return { success: false };
    }
    
    values.push(id);
    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await sql.query(query, values);
    return { success: true, user: result.rows[0] as User };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false };
  }
}

// Delete user
export async function deleteUser(id: string): Promise<{ success: boolean }> {
  try {
    await sql`DELETE FROM users WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false };
  }
}

// Toggle user status
export async function toggleUserStatus(id: string): Promise<{ success: boolean; user?: User }> {
  try {
    const result = await sql`
      UPDATE users 
      SET is_active = NOT is_active 
      WHERE id = ${id}
      RETURNING *
    `;
    return { success: true, user: result.rows[0] as User };
  } catch (error) {
    console.error('Toggle status error:', error);
    return { success: false };
  }
}
