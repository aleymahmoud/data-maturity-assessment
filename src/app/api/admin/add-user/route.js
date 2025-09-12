import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import path from 'path'
import { authOptions } from '../../auth/[...nextauth]/route'

const db = new Database(path.join(process.cwd(), 'data_maturity.db'))

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, username, email, password } = await request.json()

    // Validation
    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: 'Name, username, email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    // Check if username already exists
    const existingUsername = db.prepare('SELECT id FROM admins WHERE username = ?').get(username)
    if (existingUsername) {
      return NextResponse.json({ error: 'An admin with this username already exists' }, { status: 400 })
    }

    // Check if email already exists
    const existingEmail = db.prepare('SELECT id FROM admins WHERE email = ?').get(email)
    if (existingEmail) {
      return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new admin
    const insertStmt = db.prepare(`
      INSERT INTO admins (name, username, email, password, created_at, active) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
    `)
    
    const result = insertStmt.run(name.trim(), username.toLowerCase().trim(), email.toLowerCase().trim(), hashedPassword)

    // Get the created admin (without password)
    const newAdmin = db.prepare(`
      SELECT id, name, username, email, created_at, active 
      FROM admins 
      WHERE id = ?
    `).get(result.lastInsertRowid)

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: newAdmin
    })

  } catch (error) {
    console.error('Add user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to list all admin users
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all admin users (without passwords)
    const admins = db.prepare(`
      SELECT id, name, username, email, created_at, last_login, active 
      FROM admins 
      ORDER BY created_at DESC
    `).all()

    return NextResponse.json({ admins })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}