import { openDatabase } from '../src/lib/database.js';

async function checkSessionUsers() {
  try {
    const database = await openDatabase();

    // Check sessions and their user data
    const [sessions] = await database.query(`
      SELECT
        s.id,
        s.code,
        s.user_id,
        s.status,
        u.name as user_name,
        u.email as user_email,
        u.organization
      FROM assessment_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.session_start DESC
      LIMIT 5
    `);

    console.log('\nSessions with user data:');
    console.table(sessions);

    // Check if users exist for these sessions
    const [users] = await database.query(`
      SELECT id, name, email, organization
      FROM users
      LIMIT 5
    `);

    console.log('\nUsers in database:');
    console.table(users);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSessionUsers();
