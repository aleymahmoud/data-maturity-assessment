import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';

async function createAdminUsersTable() {
  let mysqlConnection;
  let sqliteDb;

  try {
    // Connect to MySQL
    mysqlConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to MySQL database');

    // 1. Create admin_users table
    console.log('\n📋 Creating admin_users table...');
    await mysqlConnection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_username (username),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ admin_users table created');

    // 2. Check if SQLite has admin users to migrate
    try {
      sqliteDb = new Database('data_maturity.db');
      console.log('\n👨‍💼 Checking for admin users in SQLite...');

      const adminUsers = sqliteDb.prepare('SELECT * FROM admin_users').all();
      console.log(`Found ${adminUsers.length} admin users in SQLite`);

      if (adminUsers.length > 0) {
        for (const admin of adminUsers) {
          await mysqlConnection.execute(`
            INSERT IGNORE INTO admin_users (id, username, password_hash, full_name, email, role, created_at, last_login, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [admin.id, admin.username, admin.password_hash, admin.full_name, admin.email,
              admin.role, admin.created_at, admin.last_login, admin.is_active]);
        }
        console.log('✅ Admin users migrated from SQLite');
      }
    } catch (sqliteError) {
      console.log('⚠️  No admin_users table found in SQLite or error accessing it:', sqliteError.message);

      // Create a default admin user with bcrypt hash
      console.log('\n👤 Creating default admin user...');
      const bcrypt = await import('bcryptjs');
      const defaultPasswordHash = await bcrypt.hash('admin123', 10);

      await mysqlConnection.execute(`
        INSERT IGNORE INTO admin_users (username, password_hash, full_name, email, role)
        VALUES (?, ?, ?, ?, ?)
      `, ['admin', defaultPasswordHash, 'Administrator', 'admin@example.com', 'admin']);

      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }

    // 3. Verify final state
    const [adminCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM admin_users');
    const [adminList] = await mysqlConnection.execute('SELECT username, full_name, role, is_active FROM admin_users');

    console.log(`\n📊 Final admin users count: ${adminCount[0].count}`);
    console.log('Admin users:');
    adminList.forEach(admin => {
      console.log(`  - ${admin.username} (${admin.full_name}) - Role: ${admin.role}, Active: ${admin.is_active}`);
    });

    console.log('\n🎉 Admin users table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up admin users:', error.message);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
    if (sqliteDb) {
      sqliteDb.close();
    }
  }
}

createAdminUsersTable().catch(console.error);