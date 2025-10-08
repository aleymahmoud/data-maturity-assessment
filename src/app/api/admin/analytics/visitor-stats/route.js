import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../../lib/database.js';

export async function GET(request) {
  try {
    const database = await openDatabase();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7'; // days

    // Summary stats
    const [summary] = await database.execute(`
      SELECT
        COUNT(DISTINCT code) as total_assessments_started,
        COUNT(DISTINCT CASE WHEN is_used = 1 THEN code END) as total_assessments_completed,
        COUNT(DISTINCT code) as total_unique_codes_used
      FROM assessment_codes
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [period]);

    // Daily breakdown
    const [dailyStats] = await database.execute(`
      SELECT
        DATE(s.session_start) as date,
        COUNT(DISTINCT s.id) as sessions,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed,
        COUNT(DISTINCT s.user_id) as unique_users
      FROM assessment_sessions s
      WHERE s.session_start >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(s.session_start)
      ORDER BY date DESC
    `, [period]);

    // Top organizations
    const [topOrgs] = await database.execute(`
      SELECT
        u.organization,
        COUNT(DISTINCT s.id) as sessions,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_start >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY u.organization
      ORDER BY sessions DESC
      LIMIT 10
    `, [period]);

    return NextResponse.json({
      success: true,
      data: {
        summary: summary[0],
        dailyStats,
        topOrganizations: topOrgs,
        period: `Last ${period} days`
      }
    });

  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch visitor statistics'
    }, { status: 500 });
  }
}
