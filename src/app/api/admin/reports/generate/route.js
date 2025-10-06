import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../../lib/database.js';

export async function POST(request) {
  try {
    const { codes, reportType } = await request.json();

    if (!codes || codes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No assessment codes provided'
      }, { status: 400 });
    }

    const database = await openDatabase();

    // Build WHERE clause for the selected codes
    const placeholders = codes.map(() => '?').join(',');

    // Get all completed sessions for these codes
    const [sessions] = await database.execute(`
      SELECT
        s.id,
        s.code,
        s.user_id,
        s.created_at,
        s.total_questions,
        u.name as user_name,
        u.organization,
        u.role_title,
        r.name_en as role_name
      FROM assessment_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN roles r ON u.selected_role_id = r.id
      WHERE s.status = 'completed' AND s.code IN (${placeholders})
      ORDER BY s.created_at DESC
    `, codes);

    if (sessions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No completed assessments found for the selected codes'
      }, { status: 404 });
    }

    // Get all session IDs
    const sessionIds = sessions.map(s => s.id);
    const sessionPlaceholders = sessionIds.map(() => '?').join(',');

    // Get overall scores for all sessions
    const [overallScores] = await database.execute(`
      SELECT
        session_id,
        raw_score,
        percentage_score,
        maturity_level,
        questions_answered,
        total_questions
      FROM session_scores
      WHERE session_id IN (${sessionPlaceholders}) AND score_type = 'overall'
    `, sessionIds);

    // Get subdomain scores for all sessions
    const [subdomainScores] = await database.execute(`
      SELECT
        sc.session_id,
        sc.subdomain_id,
        sc.raw_score,
        sc.percentage_score,
        sc.maturity_level,
        sc.questions_answered,
        sd.name_en as subdomain_name,
        sd.description_en as subdomain_description,
        sd.domain_id
      FROM session_scores sc
      JOIN subdomains sd ON sc.subdomain_id = sd.id
      WHERE sc.session_id IN (${sessionPlaceholders}) AND sc.score_type = 'subdomain'
      ORDER BY sd.display_order, sd.id
    `, sessionIds);

    // Calculate overall statistics
    const totalSessions = sessions.length;
    const avgRawScore = overallScores.length > 0
      ? overallScores.reduce((sum, s) => sum + parseFloat(s.raw_score || 0), 0) / overallScores.length
      : 0;
    const avgPercentage = overallScores.length > 0
      ? overallScores.reduce((sum, s) => sum + parseFloat(s.percentage_score || 0), 0) / overallScores.length
      : 0;
    const avgCompletion = overallScores.length > 0
      ? overallScores.reduce((sum, s) => sum + (parseFloat(s.questions_answered || 0) / parseFloat(s.total_questions || 1)) * 100, 0) / overallScores.length
      : 0;

    // Determine overall maturity level
    let maturityLevel = 'Initial';
    if (avgRawScore >= 4.3) maturityLevel = 'Optimized';
    else if (avgRawScore >= 3.5) maturityLevel = 'Advanced';
    else if (avgRawScore >= 2.7) maturityLevel = 'Defined';
    else if (avgRawScore >= 1.9) maturityLevel = 'Developing';

    // Group subdomain scores by subdomain and calculate averages
    const subdomainMap = {};
    subdomainScores.forEach(score => {
      if (!subdomainMap[score.subdomain_id]) {
        subdomainMap[score.subdomain_id] = {
          subdomain_id: score.subdomain_id,
          subdomain_name: score.subdomain_name,
          subdomain_description: score.subdomain_description,
          domain_id: score.domain_id,
          scores: [],
          questions_answered: []
        };
      }
      subdomainMap[score.subdomain_id].scores.push(parseFloat(score.raw_score));
      subdomainMap[score.subdomain_id].questions_answered.push(parseInt(score.questions_answered || 0));
    });

    const aggregatedSubdomains = Object.entries(subdomainMap).map(([id, data]) => {
      const avgScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
      const totalQuestionsAnswered = data.questions_answered.reduce((sum, q) => sum + q, 0);
      let level = 'Initial';
      if (avgScore >= 4.3) level = 'Optimized';
      else if (avgScore >= 3.5) level = 'Advanced';
      else if (avgScore >= 2.7) level = 'Defined';
      else if (avgScore >= 1.9) level = 'Developing';

      return {
        id: data.subdomain_id,
        name: data.subdomain_name,
        description: data.subdomain_description,
        domain_id: data.domain_id,
        score: parseFloat(avgScore.toFixed(2)),
        percentage: parseFloat(((avgScore / 5) * 100).toFixed(1)),
        maturity_level: level,
        questions_answered: totalQuestionsAnswered,
        sessions_count: data.scores.length
      };
    });

    // Get unique organizations
    const uniqueOrganizations = [...new Set(sessions.map(s => s.organization).filter(o => o))];

    // Get maturity analysis from recommendation_metadata table
    const [metadataResults] = await database.execute(`
      SELECT
        session_id,
        language,
        maturity_summary_description,
        maturity_summary_indicators
      FROM recommendation_metadata
      WHERE session_id IN (${sessionPlaceholders})
    `, sessionIds).catch(() => [[]]);

    // Get recommendations from recommendations table
    const [recommendationsResults] = await database.execute(`
      SELECT
        session_id,
        recommendation_type,
        priority,
        title,
        description,
        display_order,
        language
      FROM recommendations
      WHERE session_id IN (${sessionPlaceholders})
      ORDER BY recommendation_type, display_order
    `, sessionIds).catch(() => [[]]);

    // Determine if this is a single assessment report
    const isSingleAssessment = reportType === 'individual' && totalSessions === 1;

    // Build maturity analysis from recommendation_metadata
    let maturityAnalysis = null;

    if (metadataResults.length > 0) {
      const enMetadata = metadataResults.find(r => r.language === 'en');
      const arMetadata = metadataResults.find(r => r.language === 'ar');

      maturityAnalysis = {
        description_en: enMetadata?.maturity_summary_description || '',
        description_ar: arMetadata?.maturity_summary_description || '',
        indicators_en: enMetadata?.maturity_summary_indicators || [],
        indicators_ar: arMetadata?.maturity_summary_indicators || []
      };
    }

    // Parse recommendations from recommendations table
    let parsedRecommendations = { general: [], role: [] };

    if (recommendationsResults.length > 0) {
      // Group by language
      const enRecommendations = recommendationsResults.filter(r => r.language === 'en');
      const arRecommendations = recommendationsResults.filter(r => r.language === 'ar');

      // Get general recommendations
      const generalEn = enRecommendations.filter(r => r.recommendation_type === 'general');
      const generalAr = arRecommendations.filter(r => r.recommendation_type === 'general');

      parsedRecommendations.general = generalEn.map((rec, idx) => ({
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        title_ar: generalAr[idx]?.title || '',
        description_ar: generalAr[idx]?.description || ''
      }));

      // Get role-specific recommendations
      const roleEn = enRecommendations.filter(r => r.recommendation_type === 'role');
      const roleAr = arRecommendations.filter(r => r.recommendation_type === 'role');

      parsedRecommendations.role = roleEn.map((rec, idx) => ({
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        title_ar: roleAr[idx]?.title || '',
        description_ar: roleAr[idx]?.description || ''
      }));
    }

    // Build the report data structure
    const report = {
      reportInfo: {
        codesCount: codes.length,
        codes: codes,
        generatedAt: new Date().toISOString(),
        reportType: reportType,
        isSingleAssessment: isSingleAssessment
      },
      overallStats: {
        totalSessions: totalSessions,
        overallScore: parseFloat(avgRawScore.toFixed(2)),
        percentageScore: parseFloat(avgPercentage.toFixed(1)),
        maturityLevel: maturityLevel,
        averageCompletion: parseFloat(avgCompletion.toFixed(1))
      },
      organizations: uniqueOrganizations,
      subdomainScores: aggregatedSubdomains,
      maturityAnalysis: maturityAnalysis,
      generalRecommendations: parsedRecommendations.general || [],
      roleRecommendations: parsedRecommendations.role || [],
      sessions: sessions.map((session, idx) => ({
        ...session,
        overallScore: overallScores.find(s => s.session_id === session.id)
      }))
    };

    // For single assessment, add user-specific information
    if (isSingleAssessment) {
      const session = sessions[0];
      const overallScore = overallScores[0];
      report.userInfo = {
        name: session.user_name,
        role: session.role_name,
        organization: session.organization,
        completedDate: session.created_at
      };
      // Use total_questions from session, not from session_scores
      const actualTotalQuestions = session.total_questions || overallScore.total_questions;
      report.overallStats.questionsAnswered = overallScore.questions_answered;
      report.overallStats.totalQuestions = actualTotalQuestions;
      report.overallStats.completionRate = parseFloat(((overallScore.questions_answered / actualTotalQuestions) * 100).toFixed(1));
    }

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report: ' + error.message
    }, { status: 500 });
  }
}
