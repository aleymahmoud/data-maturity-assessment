import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';

async function checkTestCode() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('🔍 Checking TEST001 code status...');

    // Check assessment code
    const [codes] = await connection.execute('SELECT * FROM assessment_codes WHERE code = ?', ['TEST001']);
    console.log('\n📋 Assessment Code:');
    if (codes.length > 0) {
      const code = codes[0];
      console.log(`  Code: ${code.code}`);
      console.log(`  Is Used: ${code.is_used}`);
      console.log(`  Usage Count: ${code.usage_count || 0}`);
      console.log(`  Max Uses: ${code.max_uses || 'unlimited'}`);
      console.log(`  Organization: ${code.organization_name || 'N/A'}`);
    } else {
      console.log('  ❌ Code not found');
      return;
    }

    // Check sessions first to get user IDs
    const [sessions] = await connection.execute('SELECT * FROM assessment_sessions WHERE code = ? ORDER BY created_at DESC', ['TEST001']);
    console.log(`\n📊 Assessment Sessions: ${sessions.length}`);

    // Get users based on session user IDs
    const userIds = sessions.map(s => s.user_id);
    let users = [];
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      const [userResults] = await connection.execute(`SELECT * FROM users WHERE id IN (${placeholders})`, userIds);
      users = userResults;
    }

    console.log(`\n👤 Users with this code: ${users.length}`);
    users.forEach((user, i) => {
      console.log(`  User ${i + 1}:`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Name: ${user.name}`);
      console.log(`    Role ID: ${user.selected_role_id || 'Not selected'}`);
      console.log(`    Created: ${user.created_at}`);
    });

    sessions.forEach((session, i) => {
      console.log(`  Session ${i + 1}:`);
      console.log(`    ID: ${session.id}`);
      console.log(`    User ID: ${session.user_id}`);
      console.log(`    Status: ${session.status}`);
      console.log(`    Progress: ${session.questions_answered}/${session.total_questions}`);
      console.log(`    Created: ${session.created_at}`);
      console.log(`    Completed: ${session.completed_at || 'N/A'}`);
    });

    // Check responses count by session
    if (sessions.length > 0) {
      for (const session of sessions) {
        const [responses] = await connection.execute(
          'SELECT COUNT(*) as count FROM user_responses WHERE session_id = ?',
          [session.id]
        );
        console.log(`    Session ${session.id} Actual Responses: ${responses[0].count}`);
      }
    }

    // Check latest responses
    const [responses] = await connection.execute(
      'SELECT * FROM user_responses WHERE assessment_code = ? ORDER BY answered_at DESC LIMIT 10',
      ['TEST001']
    );
    console.log(`\n💭 Recent Responses: ${responses.length} (showing last 10)`);
    responses.forEach((resp, i) => {
      console.log(`  ${i + 1}. Q${resp.question_id}: ${resp.selected_option} (score: ${resp.score_value}) - ${resp.answered_at}`);
    });

    // Check if assessment is completed
    const [results] = await connection.execute('SELECT * FROM assessment_results WHERE assessment_code = ?', ['TEST001']);
    console.log(`\n📈 Assessment Results: ${results.length}`);
    if (results.length > 0) {
      results.forEach((result, i) => {
        console.log(`  Result ${i + 1}:`);
        console.log(`    User ID: ${result.user_id}`);
        console.log(`    Completed: ${result.completed_at}`);
        console.log(`    Overall Score: ${result.overall_score}`);
        console.log(`    Status: ${result.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTestCode();