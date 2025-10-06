import { openDatabase } from '../src/lib/database.js';

async function checkSessions() {
  try {
    const database = await openDatabase();

    // Check total sessions
    const [total] = await database.execute('SELECT COUNT(*) as count FROM assessment_sessions');
    console.log('Total sessions:', total[0].count);

    // Check by status
    const [byStatus] = await database.execute(`
      SELECT status, COUNT(*) as count
      FROM assessment_sessions
      GROUP BY status
    `);
    console.log('\nSessions by status:');
    console.table(byStatus);

    // Check sample sessions
    const [sessions] = await database.execute(`
      SELECT id, code, status, created_at, updated_at
      FROM assessment_sessions
      LIMIT 5
    `);
    console.log('\nSample sessions:');
    console.table(sessions);

    // Test the active count query
    const [activeCount] = await database.execute(`
      SELECT COUNT(*) as count
      FROM assessment_sessions
      WHERE status = 'in_progress'
    `);
    console.log('\nActive (in_progress) sessions:', activeCount[0].count);

    // Test completed count
    const [completedCount] = await database.execute(`
      SELECT COUNT(*) as count
      FROM assessment_sessions
      WHERE status = 'completed'
    `);
    console.log('Completed sessions:', completedCount[0].count);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSessions();
