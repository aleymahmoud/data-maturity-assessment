import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function checkRolesOrder() {
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

    const [rows] = await connection.execute(`
      SELECT id, title, created_at
      FROM roles
      ORDER BY id
    `);

    console.log('Roles in current order:\n');
    console.log('ID\t\t\tTitle\t\t\t\tCreated At');
    console.log('='.repeat(100));

    rows.forEach(role => {
      console.log(`${role.id}\t${role.title.padEnd(40)}\t${role.created_at}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkRolesOrder();
