import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../../lib/database.js';

export async function GET(request) {
  try {
    const database = await openDatabase();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get visit statistics from audit logs
    const [visitStats] = await database.execute(`
      SELECT
        DATE(timestamp) as visit_date,
        COUNT(*) as visits,
        COUNT(DISTINCT ip_address) as unique_visitors,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs
      WHERE action IN ('session_created', 'assessment_started', 'page_view')
        AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(timestamp)
      ORDER BY visit_date DESC
    `, [days]);

    // Get popular pages
    const [popularPages] = await database.execute(`
      SELECT
        details as page,
        COUNT(*) as visits
      FROM audit_logs
      WHERE action = 'page_view'
        AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY details
      ORDER BY visits DESC
      LIMIT 10
    `, [days]);

    // Get total stats
    const [totalStats] = await database.execute(`
      SELECT
        COUNT(*) as total_visits,
        COUNT(DISTINCT ip_address) as total_unique_visitors,
        COUNT(DISTINCT CASE WHEN action = 'session_created' THEN user_id END) as total_sessions,
        COUNT(DISTINCT CASE WHEN action = 'assessment_completed' THEN user_id END) as completed_assessments
      FROM audit_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    return NextResponse.json({
      success: true,
      data: {
        visitStats,
        popularPages,
        summary: totalStats[0],
        period: `Last ${days} days`
      }
    });

  } catch (error) {
    console.error('Error fetching page visit analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 });
  }
}
