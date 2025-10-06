// src/app/api/results/route.js
import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

// Function to calculate scores for a session (same logic as complete-assessment)
async function calculateScoresForSession(sessionId, database) {
  try {
    console.log('Calculating scores for session:', sessionId);
    
    // Get all responses for this session (excluding NA/NS)
    const [responses] = await database.execute(`
      SELECT 
        ur.question_id,
        ur.score_value,
        q.subdomain_id
      FROM user_responses ur
      JOIN questions q ON ur.question_id = q.id
      WHERE ur.session_id = ? AND ur.score_value > 0
    `, [sessionId]);

    console.log('Found responses for calculation:', responses.length);

    if (responses.length === 0) {
      console.log('No valid responses found for score calculation');
      return;
    }

    // Group responses by subdomain
    const subdomainData = {};
    responses.forEach(response => {
      if (!subdomainData[response.subdomain_id]) {
        subdomainData[response.subdomain_id] = [];
      }
      subdomainData[response.subdomain_id].push(response.score_value);
    });

    // Calculate scores for each subdomain
    for (const [subdomainId, scores] of Object.entries(subdomainData)) {
      const rawScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const percentageScore = (rawScore / 5) * 100;
      
      // Determine maturity level
      let maturityLevel = 'Initial';
      if (rawScore >= 4.3) maturityLevel = 'Optimized';
      else if (rawScore >= 3.5) maturityLevel = 'Advanced';
      else if (rawScore >= 2.7) maturityLevel = 'Defined';
      else if (rawScore >= 1.9) maturityLevel = 'Developing';

      // Insert subdomain score
      await database.execute(`
        INSERT INTO session_scores (
          id, session_id, subdomain_id, score_type,
          raw_score, percentage_score, maturity_level,
          questions_answered, total_questions, calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          raw_score = VALUES(raw_score),
          percentage_score = VALUES(percentage_score),
          maturity_level = VALUES(maturity_level),
          questions_answered = VALUES(questions_answered),
          total_questions = VALUES(total_questions),
          calculated_at = VALUES(calculated_at)
      `, [
        `${sessionId}_${subdomainId}_subdomain`,
        sessionId,
        subdomainId,
        'subdomain',
        parseFloat(rawScore.toFixed(2)),
        parseFloat(percentageScore.toFixed(1)),
        maturityLevel,
        scores.length,
        scores.length
      ]);
    }

    // Calculate overall score
    const allSubdomainScores = Object.values(subdomainData).flat();
    const overallRawScore = allSubdomainScores.reduce((sum, score) => sum + score, 0) / allSubdomainScores.length;
    const overallPercentage = (overallRawScore / 5) * 100;
    
    let overallMaturityLevel = 'Initial';
    if (overallRawScore >= 4.3) overallMaturityLevel = 'Optimized';
    else if (overallRawScore >= 3.5) overallMaturityLevel = 'Advanced';
    else if (overallRawScore >= 2.7) overallMaturityLevel = 'Defined';
    else if (overallRawScore >= 1.9) overallMaturityLevel = 'Developing';

    // Insert overall score
    await database.execute(`
      INSERT INTO session_scores (
        id, session_id, score_type,
        raw_score, percentage_score, maturity_level,
        questions_answered, total_questions, calculated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        raw_score = VALUES(raw_score),
        percentage_score = VALUES(percentage_score),
        maturity_level = VALUES(maturity_level),
        questions_answered = VALUES(questions_answered),
        total_questions = VALUES(total_questions),
        calculated_at = VALUES(calculated_at)
    `, [
      `${sessionId}_overall`,
      sessionId,
      'overall',
      parseFloat(overallRawScore.toFixed(2)),
      parseFloat(overallPercentage.toFixed(1)),
      overallMaturityLevel,
      allSubdomainScores.length,
      35
    ]);

    console.log('Scores calculated successfully for session:', sessionId);
  } catch (error) {
    console.error('Error calculating scores:', error);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session');
    const language = searchParams.get('lang') || 'en';
    
    console.log('Results API called with sessionId:', sessionId);
    console.log('=== RESULTS API DEBUG START ===');
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    const database = await openDatabase();
    
    // Get user data and session info
    const [sessionRows] = await database.execute(`
      SELECT
        s.*,
        u.name,
        u.email,
        u.organization,
        u.role_title,
        r.name_${language} as role_name
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN roles r ON u.selected_role_id = r.id
      WHERE s.id = ?
    `, [sessionId]);
    const sessionData = sessionRows[0];

    if (!sessionData) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    // Get ALL subdomains (assessed and unassessed)
      const [allSubdomains] = await database.execute(`
        SELECT
          sd.id,
          sd.domain_id,
          sd.name_${language} as name,
          sd.description_${language} as description,
          sd.display_order,
          COALESCE(s.raw_score, 0) as score,
          COALESCE(s.percentage_score, 0) as percentage,
          COALESCE(s.questions_answered, 0) as questions_answered,
          COALESCE(s.total_questions, 0) as total_questions
        FROM subdomains sd
        LEFT JOIN session_scores s ON sd.id = s.subdomain_id
          AND s.session_id = ?
          AND s.score_type = 'subdomain'
        ORDER BY sd.display_order
      `, [sessionId]);

    // Ensure numeric values for scores
    allSubdomains.forEach(domain => {
      domain.score = parseFloat(domain.score) || 0;
      domain.percentage = parseFloat(domain.percentage) || 0;
      domain.questions_answered = parseInt(domain.questions_answered) || 0;
      domain.total_questions = parseInt(domain.total_questions) || 0;
    });

    // Calculate overall score including zeros for unassessed domains
    const totalScore = allSubdomains.reduce((sum, domain) => sum + domain.score, 0);
    const overallScore = allSubdomains.length > 0 ? totalScore / allSubdomains.length : 0;
    
    // Determine maturity level
    let maturityLevel = 'Initial';
    if (overallScore >= 4.3) maturityLevel = 'Optimized';
    else if (overallScore >= 3.5) maturityLevel = 'Advanced';
    else if (overallScore >= 2.7) maturityLevel = 'Defined';
    else if (overallScore >= 1.9) maturityLevel = 'Developing';

    // Get total questions answered across all domains
    let totalQuestionsAnswered = allSubdomains.reduce((sum, domain) => sum + domain.questions_answered, 0);

    // Get dynamic total questions count from session
    let totalQuestions = parseInt(sessionData.total_questions) || 35;

    console.log('📊 Questions Summary:', {
      sessionTotalQuestions: sessionData.total_questions,
      calculatedTotalAnswered: totalQuestionsAnswered,
      assessmentCode: sessionData.code
    });

    // Alternatively, get from assessment code
    const assessmentCode = sessionData.code;
    if (assessmentCode) {
      const [codeRows] = await database.execute(`
        SELECT assessment_type FROM assessment_codes WHERE code = ?
      `, [assessmentCode]);
      const codeData = codeRows[0];

      if (codeData?.assessment_type === 'quick') {
        // Count priority questions for quick assessment
        const [quickCountRows] = await database.execute(`
          SELECT COUNT(*) as count FROM questions WHERE priority = 1
        `);
        const quickCount = quickCountRows[0];
        totalQuestions = parseInt(quickCount?.count) || totalQuestions;
      }
    }
    
    // Always check user_responses for accurate count
    const [responsesCountRows] = await database.execute(`
      SELECT COUNT(*) as count
      FROM user_responses
      WHERE session_id = ?
    `, [sessionId]);
    const actualResponsesCount = parseInt(responsesCountRows[0]?.count) || 0;

    console.log('📝 Actual responses in database:', actualResponsesCount);

    // Use the actual count from user_responses (more reliable)
    if (actualResponsesCount > 0) {
      totalQuestionsAnswered = actualResponsesCount;
    }

    // If no session_scores data exists, calculate scores now
    if (allSubdomains.every(domain => domain.questions_answered === 0) && actualResponsesCount > 0) {
      console.log('Found responses but no calculated scores. Calculating now...');
      await calculateScoresForSession(sessionId, database);

      // Refresh the subdomain data after calculation
      const [refreshedSubdomains] = await database.execute(`
        SELECT
          sd.id,
          sd.name_${language} as name,
          sd.description_${language} as description,
          sd.display_order,
          COALESCE(s.raw_score, 0) as score,
          COALESCE(s.percentage_score, 0) as percentage,
          COALESCE(s.questions_answered, 0) as questions_answered,
          COALESCE(s.total_questions, 0) as total_questions
        FROM subdomains sd
        LEFT JOIN session_scores s ON sd.id = s.subdomain_id
          AND s.session_id = ?
          AND s.score_type = 'subdomain'
        ORDER BY sd.display_order
      `, [sessionId]);

      // Ensure numeric values for refreshed scores
      refreshedSubdomains.forEach(domain => {
        domain.score = parseFloat(domain.score) || 0;
        domain.percentage = parseFloat(domain.percentage) || 0;
        domain.questions_answered = parseInt(domain.questions_answered) || 0;
        domain.total_questions = parseInt(domain.total_questions) || 0;
      });

      // Update variables with fresh data
      const newTotalScore = refreshedSubdomains.reduce((sum, domain) => sum + domain.score, 0);
      overallScore = refreshedSubdomains.length > 0 ? newTotalScore / refreshedSubdomains.length : 0;
      allSubdomains.splice(0, allSubdomains.length, ...refreshedSubdomains);

      // Recalculate maturity level
      if (overallScore >= 4.3) maturityLevel = 'Optimized';
      else if (overallScore >= 3.5) maturityLevel = 'Advanced';
      else if (overallScore >= 2.7) maturityLevel = 'Defined';
      else if (overallScore >= 1.9) maturityLevel = 'Developing';
      else maturityLevel = 'Initial';
    }

    console.log('✅ Final Results Summary:', {
      overallScore: parseFloat(overallScore.toFixed(1)),
      maturityLevel,
      questionsAnswered: totalQuestionsAnswered,
      totalQuestions,
      completionRate: Math.round((totalQuestionsAnswered / totalQuestions) * 100)
    });

    return NextResponse.json({
      success: true,
      results: {
        overallScore: parseFloat(overallScore.toFixed(1)),
        maturityLevel: maturityLevel,
        questionsAnswered: totalQuestionsAnswered,
        totalQuestions: totalQuestions,
        completionRate: Math.round((totalQuestionsAnswered / totalQuestions) * 100),
        userData: {
          name: sessionData.name,
          role: sessionData.role_name || sessionData.role_title,
          organization: sessionData.organization,
          email: sessionData.email
        },
        subdomainScores: allSubdomains,
        // Temporary recommendations placeholders
        generalRecommendations: [
          { priority: 'high', title: language === 'ar' ? 'جاري تحليل النتائج...' : 'Analyzing your results...', description: language === 'ar' ? 'سيتم إنشاء توصيات مخصصة بناءً على إجاباتك' : 'Personalized recommendations will be generated based on your responses' }
        ],
        roleRecommendations: [
          { priority: 'high', title: language === 'ar' ? 'جاري تحليل النتائج...' : 'Analyzing your results...', description: language === 'ar' ? 'سيتم إنشاء توصيات مخصصة لدورك' : 'Role-specific recommendations will be generated' }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch results'
    }, { status: 500 });
  }
}