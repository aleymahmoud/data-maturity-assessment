import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const organization = searchParams.get('organization') || 'all';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;

    const database = await openDatabase();

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

    // Get sessions with user details
    // Note: MySQL doesn't support placeholders for LIMIT/OFFSET in prepared statements
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
      LEFT JOIN users u ON s.user_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
      LEFT JOIN roles r ON u.selected_role_id = r.id
      LEFT JOIN assessment_codes ac ON s.code COLLATE utf8mb4_unicode_ci = ac.code COLLATE utf8mb4_unicode_ci
      LEFT JOIN assessment_results ar ON s.id COLLATE utf8mb4_unicode_ci = ar.session_id COLLATE utf8mb4_unicode_ci
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    // Get total count for pagination
    const [countResult] = await database.query(`
      SELECT COUNT(*) as total
      FROM assessment_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE ${whereClause}
    `, params);

    const totalSessions = countResult[0].total;

    // Get overview statistics
    const [activeCount] = await database.execute(`
      SELECT COUNT(*) as count
      FROM assessment_sessions
      WHERE status = 'in_progress'
    `);

    const [completedCount] = await database.execute(`
      SELECT COUNT(*) as count
      FROM assessment_sessions
      WHERE status = 'completed'
    `);

    const [abandonedCount] = await database.execute(`
      SELECT COUNT(*) as count
      FROM assessment_sessions
      WHERE status = 'abandoned'
    `);

    // Calculate average duration for completed sessions
    const [avgDuration] = await database.execute(`
      SELECT AVG(TIMESTAMPDIFF(SECOND, session_start, session_end) / 60) as avg_minutes
      FROM assessment_sessions
      WHERE status = 'completed' AND session_end IS NOT NULL
    `);

    const stats = {
      activeSessions: activeCount[0].count,
      completedSessions: completedCount[0].count,
      abandonedSessions: abandonedCount[0].count,
      averageDuration: Math.round(avgDuration[0].avg_minutes || 0),
      totalSessions: totalSessions
    };

    // Get unique organizations for filter
    const [organizations] = await database.execute(`
      SELECT DISTINCT u.organization
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.organization IS NOT NULL AND u.organization != ''
      ORDER BY u.organization
    `);

    // Calculate scores and maturity levels for sessions without results
    const transformedSessions = await Promise.all(sessions.map(async (session) => {
      let overallScore = session.overall_score;
      let maturityLevel = session.overall_maturity_level;

      // If no results exist, calculate from responses
      if (!overallScore && session.status === 'completed') {
        try {
          const [responses] = await database.query(`
            SELECT AVG(ur.score_value) as avg_score
            FROM user_responses ur
            WHERE ur.session_id = ? AND ur.score_value > 0
          `, [session.id]);

          if (responses[0] && responses[0].avg_score) {
            const rawScore = parseFloat(responses[0].avg_score);
            overallScore = parseFloat(rawScore.toFixed(2));

            // Determine maturity level based on raw score
            if (rawScore >= 4.3) maturityLevel = 'Optimized';
            else if (rawScore >= 3.5) maturityLevel = 'Advanced';
            else if (rawScore >= 2.7) maturityLevel = 'Defined';
            else if (rawScore >= 1.9) maturityLevel = 'Developing';
            else maturityLevel = 'Initial';
          }
        } catch (err) {
          console.error('Error calculating score for session:', session.id, err);
        }
      }

      return {
        id: session.id,
        code: session.code,
        assessmentCode: session.code,
        userId: session.user_id,
        status: session.status,
        createdAt: session.created_at,
        completedAt: session.completed_at,
        sessionStart: session.session_start,
        sessionEnd: session.session_end,
        totalQuestions: session.total_questions,
        questionsAnswered: session.questions_answered,
        completionPercentage: session.completion_percentage,
        languagePreference: session.language_preference,
        durationMinutes: Math.round(session.duration_minutes || 0),
        userName: session.user_name,
        userEmail: session.user_email,
        organization: session.organization,
        roleTitle: session.role_title,
        roleName: session.role_name,
        assessmentType: session.assessment_type,
        codeOrganization: session.code_organization,
        overallScore: overallScore,
        maturityLevel: maturityLevel
      };
    }));

    return NextResponse.json({
      success: true,
      sessions: transformedSessions,
      stats,
      organizations: organizations.map(o => o.organization),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        totalItems: totalSessions,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sessions: ' + error.message
    }, { status: 500 });
  }
}
