import { openDatabase } from '../src/lib/database.js';

async function checkDuplicateUsers() {
  try {
    const db = await openDatabase();
    const code = '3ANPQ91I';

    console.log('=== CHECKING CODE 3ANPQ91I ===\n');

    // Check assessment code details
    const [codeRows] = await db.execute(`
      SELECT * FROM assessment_codes WHERE code = ?
    `, [code]);

    if (codeRows.length > 0) {
      console.log('Assessment Code Details:');
      console.log('- Code:', codeRows[0].code);
      console.log('- Type:', codeRows[0].assessment_type);
      console.log('- Organization:', codeRows[0].organization_name);
      console.log('- Question List:', codeRows[0].question_list ? 'Present' : 'Missing');
      if (codeRows[0].question_list) {
        const questionList = typeof codeRows[0].question_list === 'string'
          ? JSON.parse(codeRows[0].question_list)
          : codeRows[0].question_list;
        console.log('- Number of questions:', Array.isArray(questionList) ? questionList.length : 'Invalid');
      }
    } else {
      console.log('❌ Code not found in database');
    }

    console.log('\n=== CHECKING SESSIONS ===\n');

    // Check all sessions with this code
    const [sessionRows] = await db.execute(`
      SELECT s.*, u.name, u.email
      FROM assessment_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.code = ?
      ORDER BY s.session_start DESC
    `, [code]);

    console.log(`Found ${sessionRows.length} sessions with code ${code}:`);
    sessionRows.forEach((session, index) => {
      console.log(`\nSession ${index + 1}:`);
      console.log('- Session ID:', session.id);
      console.log('- User ID:', session.user_id);
      console.log('- User Name:', session.name || 'N/A');
      console.log('- User Email:', session.email || 'N/A');
      console.log('- Status:', session.status);
      console.log('- Started:', session.session_start);
    });

    console.log('\n=== CHECKING USERS ===\n');

    // Check for duplicate users
    const [userRows] = await db.execute(`
      SELECT u.*,
        (SELECT COUNT(*) FROM assessment_sessions s WHERE s.user_id = u.id) as session_count
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT user_id FROM assessment_sessions WHERE code = ?
      )
    `, [code]);

    console.log(`Found ${userRows.length} users associated with code ${code}:`);
    userRows.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('- User ID:', user.id);
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Organization:', user.organization);
      console.log('- Role:', user.selected_role_id);
      console.log('- Session Count:', user.session_count);
    });

    // Check for duplicate emails
    const [duplicateEmails] = await db.execute(`
      SELECT email, COUNT(*) as count
      FROM users
      WHERE email IN (
        SELECT email FROM users u
        JOIN assessment_sessions s ON u.id = s.user_id
        WHERE s.code = ?
      )
      GROUP BY email
      HAVING count > 1
    `, [code]);

    if (duplicateEmails.length > 0) {
      console.log('\n⚠️ DUPLICATE EMAILS FOUND:');
      duplicateEmails.forEach(dup => {
        console.log(`- ${dup.email}: ${dup.count} occurrences`);
      });
    }

    console.log('\n=== CHECKING USER RESPONSES ===\n');

    // Check user responses
    const [responseRows] = await db.execute(`
      SELECT session_id, COUNT(*) as response_count
      FROM user_responses
      WHERE session_id IN (
        SELECT id FROM assessment_sessions WHERE code = ?
      )
      GROUP BY session_id
    `, [code]);

    console.log(`Found responses for ${responseRows.length} sessions:`);
    responseRows.forEach(resp => {
      console.log(`- Session ${resp.session_id}: ${resp.response_count} responses`);
    });

    await db.end();
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDuplicateUsers();