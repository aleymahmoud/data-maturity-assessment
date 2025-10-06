import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const organization = searchParams.get('organization');
    const user = searchParams.get('user');
    const department = searchParams.get('department');

    const database = await openDatabase();

    // Build WHERE clause for filtering
    let whereConditions = [];
    let params = [];

    if (start && end) {
      whereConditions.push('ac.created_at BETWEEN ? AND ?');
      params.push(start, end);
    }

    if (organization && organization !== 'all') {
      const orgs = organization.split(',');
      whereConditions.push(`u.organization IN (${orgs.map(() => '?').join(',')})`);
      params.push(...orgs);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get only assessment codes with completed assessments
    const [codes] = await database.execute(`
      SELECT DISTINCT
        ac.code,
        ac.organization_name,
        ac.assessment_type,
        ac.created_at,
        ac.expires_at,
        u.name as user_name
      FROM assessment_codes ac
      INNER JOIN assessment_sessions s ON ac.code = s.code
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status = 'completed'
      ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      ORDER BY ac.created_at DESC
    `, params);

    // Get unique organizations
    const [organizations] = await database.execute(`
      SELECT DISTINCT u.organization
      FROM users u
      JOIN assessment_sessions s ON u.id = s.user_id
      WHERE u.organization IS NOT NULL AND u.organization != ''
      ORDER BY u.organization
    `);

    // Get unique users
    const [users] = await database.execute(`
      SELECT DISTINCT u.name
      FROM users u
      JOIN assessment_sessions s ON u.id = s.user_id
      WHERE u.name IS NOT NULL AND u.name != ''
      ORDER BY u.name
    `);

    // Get unique role titles (departments/job titles)
    const [departments] = await database.execute(`
      SELECT DISTINCT u.role_title
      FROM users u
      JOIN assessment_sessions s ON u.id = s.user_id
      WHERE u.role_title IS NOT NULL AND u.role_title != ''
      ORDER BY u.role_title
    `);

    return NextResponse.json({
      success: true,
      codes,
      organizations: organizations.map(o => o.organization),
      users: users.map(u => u.name),
      departments: departments.map(d => d.role_title)
    });

  } catch (error) {
    console.error('Error fetching assessment codes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assessment codes'
    }, { status: 500 });
  }
}
