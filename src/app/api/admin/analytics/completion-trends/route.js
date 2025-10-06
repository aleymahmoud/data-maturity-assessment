import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const database = await openDatabase();

    // Get completion trends by month
    const [monthlyTrends] = await database.execute(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as completions
      FROM assessment_sessions
      WHERE status = 'completed'
      ${start && end ? 'AND created_at BETWEEN ? AND ?' : ''}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `, start && end ? [start, end] : []);

    // Get daily completion trends (last 30 days)
    const [dailyTrends] = await database.execute(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as completions
      FROM assessment_sessions
      WHERE status = 'completed'
      ${start && end ? 'AND created_at BETWEEN ? AND ?' : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, start && end ? [start, end] : []);

    // Get organization completion data
    const [organizationCompletion] = await database.execute(`
      SELECT
        u.organization,
        COUNT(*) as completions
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'completed'
      ${start && end ? 'AND s.created_at BETWEEN ? AND ?' : ''}
      GROUP BY u.organization
      ORDER BY completions DESC
      LIMIT 10
    `, start && end ? [start, end] : []);

    // Get assessment type distribution
    const [typeDistribution] = await database.execute(`
      SELECT
        ac.assessment_type as type,
        COUNT(*) as completions
      FROM assessment_sessions s
      JOIN assessment_codes ac ON s.code = ac.code
      WHERE s.status = 'completed'
      ${start && end ? 'AND s.created_at BETWEEN ? AND ?' : ''}
      GROUP BY ac.assessment_type
    `, start && end ? [start, end] : []);

    return NextResponse.json({
      success: true,
      data: {
        monthlyTrends,
        dailyTrends: dailyTrends.reverse(), // Reverse to show oldest first
        organizationCompletion,
        typeDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching completion trends:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trends'
    }, { status: 500 });
  }
}
