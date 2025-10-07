import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function addUserProfileFields() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'data_maturity',
      charset: 'utf8mb4'
    });

    console.log('Connected to database\n');

    // Add new columns to users table
    console.log('Adding new profile fields to users table...');

    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN organization_size VARCHAR(50)`);
      console.log('✓ Added organization_size column');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  organization_size column already exists');
      } else throw err;
    }

    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN industry VARCHAR(100)`);
      console.log('✓ Added industry column');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  industry column already exists');
      } else throw err;
    }

    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN country VARCHAR(10)`);
      console.log('✓ Added country column\n');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  country column already exists\n');
      } else throw err;
    }

    // Verify the columns were added
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM users LIKE 'organization_size'
    `);

    if (columns.length > 0) {
      console.log('✅ Database schema updated successfully!');

      // Show current table structure
      const [tableStructure] = await connection.execute(`
        DESCRIBE users
      `);

      console.log('\nCurrent users table structure:');
      console.log('Field\t\t\t\tType\t\t\tNull\tKey');
      console.log('='.repeat(80));
      tableStructure.forEach(col => {
        console.log(`${col.Field.padEnd(30)}\t${col.Type.padEnd(20)}\t${col.Null}\t${col.Key}`);
      });
    } else {
      console.log('❌ Failed to verify new columns');
    }

  } catch (error) {
    console.error('Error:', error.message);

    // If columns already exist, that's okay
    if (error.message.includes('Duplicate column name')) {
      console.log('\n✓ Columns already exist - schema is up to date');
    }
  } finally {
    if (connection) await connection.end();
  }
}

addUserProfileFields();
