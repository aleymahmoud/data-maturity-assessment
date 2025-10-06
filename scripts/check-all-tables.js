import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';

async function checkAllTables() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('🔍 Checking all tables in the database:');
    const [tables] = await connection.execute('SHOW TABLES');

    console.log('\n📋 All tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log('  - ' + tableName);
    });

    console.log('\n🔍 Filtering for question/option related tables:');
    const questionTables = tables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('question') || tableName.includes('option');
    });

    if (questionTables.length === 0) {
      console.log('No question/option related tables found');
      return;
    }

    for (const table of questionTables) {
      const tableName = Object.values(table)[0];
      console.log(`\n📊 Table: ${tableName}`);

      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(`   Records: ${count[0].count}`);

        const [structure] = await connection.execute(`DESCRIBE \`${tableName}\``);
        console.log('   Columns: ' + structure.map(col => col.Field).join(', '));
      } catch (error) {
        console.log(`   Error accessing table: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAllTables();