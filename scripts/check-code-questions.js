import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';

async function checkCodeQuestions() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Pick a code to test with
    const testCode = 'TEST001';

    console.log(`🔍 Checking questions for code: ${testCode}\n`);

    // Get questions answered for this code
    const [responses] = await connection.execute(`
      SELECT DISTINCT
        ur.question_id,
        q.title_en,
        q.text_en,
        s.name_en as subdomain_name,
        COUNT(ur.id) as response_count
      FROM user_responses ur
      LEFT JOIN questions q ON ur.question_id = q.id
      LEFT JOIN subdomains s ON q.subdomain_id = s.id
      WHERE ur.assessment_code = ?
      GROUP BY ur.question_id
      ORDER BY q.display_order
    `, [testCode]);

    console.log(`📊 Questions answered with this code: ${responses.length}\n`);

    responses.forEach((q, i) => {
      console.log(`${i + 1}. [${q.question_id}] ${q.title_en || q.text_en?.substring(0, 50) + '...'}`);
      console.log(`   Subdomain: ${q.subdomain_name || 'N/A'}`);
      console.log(`   Responses: ${q.response_count}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkCodeQuestions();
