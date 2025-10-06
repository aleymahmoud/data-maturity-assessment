import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';
import fs from 'fs';

async function populateData() {
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

    // Read the populate SQL file
    const populateSQL = fs.readFileSync('populate_mysql_data.sql', 'utf8');

    // Split by semicolons and execute each statement
    const statements = populateSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('USE'));

    console.log(`Executing ${statements.length} data population statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          if (!error.message.includes('Duplicate entry')) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          } else {
            console.log(`⚠️  Statement ${i + 1}: Skipping duplicate entry`);
          }
        }
      }
    }

    // Verify data was inserted
    const [domains] = await connection.execute('SELECT COUNT(*) as count FROM domains');
    const [subdomains] = await connection.execute('SELECT COUNT(*) as count FROM subdomains');
    const [roles] = await connection.execute('SELECT COUNT(*) as count FROM roles');
    const [questions] = await connection.execute('SELECT COUNT(*) as count FROM questions');
    const [options] = await connection.execute('SELECT COUNT(*) as count FROM question_options');
    const [codes] = await connection.execute('SELECT COUNT(*) as count FROM assessment_codes');

    console.log(`✅ Data population complete!`);
    console.log(`  - Domains: ${domains[0].count}`);
    console.log(`  - Subdomains: ${subdomains[0].count}`);
    console.log(`  - Roles: ${roles[0].count}`);
    console.log(`  - Questions: ${questions[0].count}`);
    console.log(`  - Question Options: ${options[0].count}`);
    console.log(`  - Assessment Codes: ${codes[0].count}`);

  } catch (error) {
    console.error('❌ Data population failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

populateData();