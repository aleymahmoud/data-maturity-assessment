import { openDatabase } from '../src/lib/database.js';

async function testSessionsAPI() {
  try {
    const database = await openDatabase();

    const status = 'all';
    const organization = 'all';
    const start = '2025-01-01';
    const end = new Date().toISOString().split('T')[0];
    const search = '';
    const limit = 20;
    const offset = 0;

    // Build WHERE clause
    let whereConditions = ['1=1'];
    let params = [];

    if (status !== 'all') {
      whereConditions.push('s.status = ?');
      params.push(status);
    }

    if (organization !== 'all') {
      whereConditions.push('u.organization = ?');
      params.push(organization);
    }

    if (start && end) {
      whereConditions.push('s.created_at >= ? AND s.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
      params.push(start + ' 00:00:00', end + ' 23:59:59');
    }

    if (search) {
      whereConditions.push('(u.name LIKE ? OR u.email LIKE ? OR s.code LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.join(' AND ');

    console.log('WHERE clause:', whereClause);
    console.log('Params:', params);

    // Test the query - updated to match the actual API
    const [sessions] = await database.query(`
      SELECT
        s.id,
        s.code,
        s.user_id,
        s.status,
        s.created_at,
        s.completed_at,
        s.session_start,
        s.session_end,
        s.total_questions,
        s.questions_answered,
        s.completion_percentage,
        s.language_preference,
        u.name as user_name,
        u.email as user_email,
        u.organization,
        u.role_title,
        r.name_en as role_name,
        ac.assessment_type,
        ac.organization_name as code_organization,
        ar.overall_score,
        ar.overall_maturity_level,
        TIMESTAMPDIFF(SECOND, s.session_start, COALESCE(s.session_end, NOW())) / 60 as duration_minutes
      FROM assessment_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN roles r ON u.selected_role_id = r.id
      LEFT JOIN assessment_codes ac ON s.code = ac.code
      LEFT JOIN assessment_results ar ON s.id = ar.session_id
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    console.log('\nSessions found:', sessions.length);
    console.table(sessions);

    // Test statistics queries
    const [activeCount] = await database.execute(`
      SELECT COUNT(*) as count
      FROM assessment_sessions
      WHERE status = 'in_progress'
    `);
    console.log('\nActive sessions:', activeCount[0].count);

    const [completedCount] = await database.execute(`
      SELECT COUNT(*) as count
      FROM assessment_sessions
      WHERE status = 'completed'
    `);
    console.log('Completed sessions:', completedCount[0].count);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSessionsAPI();
