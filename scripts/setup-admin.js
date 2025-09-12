// scripts/setup-admin.js
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const db = new Database(path.join(process.cwd(), 'data_maturity.db'))

// Create admins table
const createAdminTable = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      active INTEGER DEFAULT 1
    )
  `
  
  db.exec(createTableSQL)
  console.log('✅ Admins table created successfully')
}

// Create default admin user
const createDefaultAdmin = async () => {
  const hashedPassword = await bcrypt.hash('admin123!', 12)
  
  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO admins (name, email, password) 
    VALUES (?, ?, ?)
  `)
  
  const result = insertAdmin.run('Super Admin', 'admin@company.com', hashedPassword)
  
  if (result.changes > 0) {
    console.log('✅ Default admin created successfully')
    console.log('📧 Email: admin@company.com')
    console.log('🔒 Password: admin123!')
    console.log('⚠️  Please change these credentials after first login')
  } else {
    console.log('ℹ️  Admin user already exists')
  }
}

// Run setup
const setupAdmin = async () => {
  try {
    createAdminTable()
    await createDefaultAdmin()
    db.close()
    console.log('✅ Admin setup completed')
  } catch (error) {
    console.error('❌ Error setting up admin:', error)
    db.close()
  }
}

setupAdmin()