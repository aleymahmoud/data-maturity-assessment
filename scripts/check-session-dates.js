import { openDatabase } from '../src/lib/database.js';

async function checkSessionDates() {
  try {
    const database = await openDatabase();

    // Get session dates
    const [sessions] = await database.execute(`
      SELECT
        id,
        code,
        status,
        created_at,
        DATE(created_at) as date_only
      FROM assessment_sessions
      ORDER BY created_at DESC
    `);

    console.log('\nAll sessions:');
    console.table(sessions);

    // Check what the current date filter would be
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('\nCurrent date filter would be:');
    console.log('Start:', thirtyDaysAgo);
    console.log('End:', today);

    // Test the query with date filter
    const [filtered] = await database.execute(`
      SELECT COUNT(*) as count
      FROM assessment_sessions s
      WHERE DATE(s.created_at) BETWEEN ? AND ?
    `, [thirtyDaysAgo, today]);

    console.log('\nSessions in date range:', filtered[0].count);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSessionDates();
