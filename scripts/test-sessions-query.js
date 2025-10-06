import { openDatabase } from '../src/lib/database.js';

async function testQuery() {
  try {
    const database = await openDatabase();

    // Test the default query that the API would run
    const status = 'all';
    const organization = 'all';
    const start = '2025-01-01';
    const end = new Date().toISOString().split('T')[0];
    const search = '';
    const limit = 20;
    const offset = 0;

    // Build WHERE clause (same logic as API)
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

    // Temporarily comment out date filter to test
    // if (start && end) {
    //   whereConditions.push('s.created_at >= ? AND s.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
    //   params.push(start, end);
    // }

    if (search) {
      whereConditions.push('(u.name LIKE ? OR u.email LIKE ? OR s.code LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.join(' AND ');

    console.log('WHERE clause:', whereClause);
    console.log('Params:', params);
    console.log('Limit:', limit, typeof limit);
    console.log('Offset:', offset, typeof offset);
    console.log('Params for main query:', [...params, limit, offset]);

    // Test using query instead of execute
    console.log('\nTesting main sessions query with query() instead of execute()...');
    const [sessions] = await database.query(`
      SELECT
        s.id,
        s.code,
        s.user_id,
        s.status,
        s.created_at,
        s.total_questions,
        u.name as user_name,
        u.email as user_email,
        u.organization,
        u.role_title,
        r.name_en as role_name,
        ac.assessment_type,
        ac.organization_name as code_organization
      FROM assessment_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN roles r ON u.selected_role_id = r.id
      LEFT JOIN assessment_codes ac ON s.code = ac.code
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    console.log('Sessions found:', sessions.length);
    console.table(sessions);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

testQuery();
