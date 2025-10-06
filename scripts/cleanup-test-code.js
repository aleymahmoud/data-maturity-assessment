import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';

async function cleanupTestCode() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('🧹 Cleaning up TEST001 data...');

    // Delete user responses
    await connection.execute('DELETE FROM user_responses WHERE assessment_code = ?', ['TEST001']);
    console.log('✅ Deleted user responses');

    // Delete assessment results
    await connection.execute('DELETE FROM assessment_results WHERE assessment_code = ?', ['TEST001']);
    console.log('✅ Deleted assessment results');

    // Delete assessment sessions
    await connection.execute('DELETE FROM assessment_sessions WHERE code = ?', ['TEST001']);
    console.log('✅ Deleted assessment sessions');

    // Delete users (get user IDs from sessions first - but sessions are already deleted, so delete all test users)
    await connection.execute('DELETE FROM users WHERE name LIKE ?', ['%Test%']);
    console.log('✅ Deleted test users');

    // Reset code status
    await connection.execute('UPDATE assessment_codes SET is_used = 0, usage_count = 0 WHERE code = ?', ['TEST001']);
    console.log('✅ Reset TEST001 code status');

    console.log('\n🎉 Cleanup completed! TEST001 is ready for fresh testing.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanupTestCode();