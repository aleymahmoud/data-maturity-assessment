import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';

async function testAssessmentTypeChange() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('🔍 Testing Assessment Type Change Impact on Question List\n');

    // Get a code to test with
    const [codes] = await connection.query(`
      SELECT code, organization_name, assessment_type, question_list
      FROM assessment_codes
      WHERE question_list IS NOT NULL
      LIMIT 1
    `);

    if (codes.length === 0) {
      console.log('❌ No codes with question_list found');
      return;
    }

    const testCode = codes[0];
    console.log('📋 Test Code:', testCode.code);
    console.log('   Organization:', testCode.organization_name);
    console.log('   Current Type:', testCode.assessment_type);
    console.log('   Current Questions:', testCode.question_list.length, 'questions');
    console.log('   Questions:', testCode.question_list.join(', '));

    console.log('\n' + '='.repeat(60));

    // Count questions by type
    const [fullCount] = await connection.query('SELECT COUNT(*) as count FROM questions');
    const [quickCount] = await connection.query('SELECT COUNT(*) as count FROM questions WHERE priority = 1');

    console.log('\n📊 Available Questions:');
    console.log('   Full Assessment:', fullCount[0].count, 'questions (all)');
    console.log('   Quick Assessment:', quickCount[0].count, 'questions (priority = 1)');

    console.log('\n✅ When changing assessment type:');
    console.log('   • Full → Quick: Question list will update from', fullCount[0].count, 'to', quickCount[0].count, 'questions');
    console.log('   • Quick → Full: Question list will update from', quickCount[0].count, 'to', fullCount[0].count, 'questions');

    // Show which questions would be in quick assessment
    const [quickQuestions] = await connection.query(`
      SELECT id, title_en, priority
      FROM questions
      WHERE priority = 1
      ORDER BY display_order
    `);

    console.log('\n📝 Quick Assessment Questions (priority = 1):');
    quickQuestions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.id} - ${q.title_en}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAssessmentTypeChange();
