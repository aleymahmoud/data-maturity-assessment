import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const database = await openDatabase();

    // Get total assessments
    const [totalAssessments] = await database.execute(`
      SELECT COUNT(*) as count
      FROM assessment_sessions
      WHERE status = 'completed'
      ${start && end ? 'AND created_at BETWEEN ? AND ?' : ''}
    `, start && end ? [start, end] : []);

    // Get average score
    const [avgScore] = await database.execute(`
      SELECT AVG(sc.raw_score) as avg_score
      FROM session_scores sc
      JOIN assessment_sessions s ON sc.session_id = s.id
      WHERE sc.score_type = 'overall'
      ${start && end ? 'AND s.created_at BETWEEN ? AND ?' : ''}
    `, start && end ? [start, end] : []);

    // Get completion rate
    const [completionRate] = await database.execute(`
      SELECT
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as rate
      FROM assessment_sessions
      ${start && end ? 'WHERE created_at BETWEEN ? AND ?' : ''}
    `, start && end ? [start, end] : []);

    // Get total unique organizations
    const [totalOrganizations] = await database.execute(`
      SELECT COUNT(DISTINCT u.organization) as count
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'completed'
      ${start && end ? 'AND s.created_at BETWEEN ? AND ?' : ''}
    `, start && end ? [start, end] : []);

    return NextResponse.json({
      success: true,
      data: {
        totalAssessments: totalAssessments[0].count || 0,
        totalOrganizations: totalOrganizations[0].count || 0,
        avgMaturityScore: parseFloat(avgScore[0].avg_score || 0).toFixed(1),
        completionRate: parseFloat(completionRate[0].rate || 0).toFixed(1)
      }
    });

  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 });
  }
}
