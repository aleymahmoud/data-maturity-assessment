import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';
import fs from 'fs';

async function importSchema() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to MySQL database:', process.env.DB_NAME);

    // Read the SQL schema file
    const schemaSQL = fs.readFileSync('data_maturity_mysql.sql', 'utf8');

    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }

    // Verify tables were created
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Schema import complete! ${tables.length} tables found:`);
    tables.forEach(table => console.log('  - ' + Object.values(table)[0]));

  } catch (error) {
    console.error('❌ Schema import failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importSchema();