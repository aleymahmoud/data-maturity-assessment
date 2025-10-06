import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../lib/database.js';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { name, username, email, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username, password, and role are required'
      }, { status: 400 });
    }

    const database = await openDatabase();

    // Check if username already exists
    const [existingUsers] = await database.execute(
      'SELECT id FROM admin_users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Username already exists'
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with default role 'admin'
    const [result] = await database.execute(
      'INSERT INTO admin_users (username, password_hash, role, email, full_name, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [username, hashedPassword, 'admin', email || null, name || null]
    );

    return NextResponse.json({
      success: true,
      message: 'User added successfully',
      user: {
        id: result.insertId,
        username,
        email,
        name,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add user'
    }, { status: 500 });
  }
}
