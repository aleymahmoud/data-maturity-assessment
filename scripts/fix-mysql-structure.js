import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';

async function fixMySQLStructure() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to MySQL database');

    // Fix assessment_codes table - add missing usage_count column
    try {
      await connection.execute('ALTER TABLE assessment_codes ADD COLUMN usage_count INT DEFAULT 0');
      console.log('✅ Added usage_count column to assessment_codes');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  usage_count column already exists in assessment_codes');
      } else {
        console.error('❌ Error adding usage_count:', error.message);
      }
    }

    // Drop and recreate user_responses table with consistent collation
    await connection.execute('DROP TABLE IF EXISTS user_responses');
    await connection.execute(`
      CREATE TABLE user_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        question_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        selected_option VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
        score_value INT NOT NULL,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assessment_code VARCHAR(255) COLLATE utf8mb4_unicode_ci,
        UNIQUE KEY unique_session_question (session_id, question_id),
        INDEX idx_session_id (session_id),
        INDEX idx_question_id (question_id),
        INDEX idx_assessment_code (assessment_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Recreated user_responses table with consistent collation');

    // Ensure all varchar columns in questions table use utf8mb4_unicode_ci
    await connection.execute(`
      ALTER TABLE questions
      MODIFY COLUMN id VARCHAR(255) COLLATE utf8mb4_unicode_ci,
      MODIFY COLUMN subdomain_id VARCHAR(255) COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ Fixed questions table collation');

    // Ensure all varchar columns in assessment_sessions table use utf8mb4_unicode_ci
    await connection.execute(`
      ALTER TABLE assessment_sessions
      MODIFY COLUMN id VARCHAR(255) COLLATE utf8mb4_unicode_ci,
      MODIFY COLUMN user_id VARCHAR(255) COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ Fixed assessment_sessions table collation');

    // Verify final structure
    console.log('\\n📋 Verifying table structures:');

    const [assessmentCodesColumns] = await connection.execute('DESCRIBE assessment_codes');
    console.log('assessment_codes columns:');
    assessmentCodesColumns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

    const [userResponsesColumns] = await connection.execute('DESCRIBE user_responses');
    console.log('\\nuser_responses columns:');
    userResponsesColumns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

    const [assessmentSessionsColumns] = await connection.execute('DESCRIBE assessment_sessions');
    console.log('\\nassessment_sessions columns:');
    assessmentSessionsColumns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

    console.log('\\n✅ All database structure issues fixed!');

  } catch (error) {
    console.error('❌ Error fixing database structure:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixMySQLStructure();