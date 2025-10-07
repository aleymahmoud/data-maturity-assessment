import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function checkSchema() {
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

    console.log('✅ Connected to database');

    // Check subdomains table structure
    console.log('\n📋 Subdomains table structure:');
    const [subdomainsColumns] = await connection.execute('DESCRIBE subdomains');
    console.table(subdomainsColumns);

    // Check roles table structure (if exists)
    try {
      console.log('\n📋 Roles table structure:');
      const [rolesColumns] = await connection.execute('DESCRIBE roles');
      console.table(rolesColumns);
    } catch (e) {
      console.log('Roles table does not exist yet');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSchema();
