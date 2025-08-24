// src/app/api/results/route.js
import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session');
    const language = searchParams.get('lang') || 'en';
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    const database = await openDatabase();
    
    // Get user data and session info
    const sessionData = await database.get(`
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

    if (!sessionData) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    // Get ALL subdomains (assessed and unassessed)
    const allSubdomains = await database.all(`
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
    const totalQuestionsAnswered = allSubdomains.reduce((sum, domain) => sum + domain.questions_answered, 0);
    const totalQuestions = 35; // Your app has 35 total questions

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