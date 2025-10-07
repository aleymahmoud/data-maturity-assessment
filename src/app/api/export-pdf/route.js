// src/app/api/export-pdf/route.js
import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';
import puppeteer from 'puppeteer';


// Helper function to get priority colors (matching results page)
function getPriorityColor(priority) {
  switch (priority) {
    case 'high': return '#dc3545';
    case 'medium': return '#ffc107';
    case 'low': return '#28a745';
    default: return '#6c757d';
  }
}

// Helper function to get priority icons (matching results page)
function getPriorityIcon(priority) {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

export async function POST(request) {
  try {
    const { reportData, reportType } = await request.json();

    if (!reportData) {
      return NextResponse.json({
        success: false,
        error: 'Report data is required'
      }, { status: 400 });
    }

    // Generate admin report PDF
    const language = 'en'; // Default to English for admin reports

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Admin Assessment Report</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                padding: 20px;
                color: #0f2c69;
            }
            .header {
                text-align: center;
                background: linear-gradient(135deg, #0f2c69, #7f7afe);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
            }
            .header h1 {
                margin: 0 0 10px 0;
                font-size: 2rem;
            }
            .report-info {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .stat {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #ededed;
            }
            h2 {
                color: #0f2c69;
                margin-top: 30px;
                margin-bottom: 15px;
            }
            .subdomain {
                background: #f8f9fa;
                padding: 12px;
                margin: 8px 0;
                border-radius: 6px;
                border-left: 4px solid #7f7afe;
            }
            .recommendation {
                background: rgba(127, 122, 254, 0.05);
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border-left: 4px solid #7f7afe;
            }
            .recommendation h3 {
                margin: 0 0 8px 0;
                color: #0f2c69;
                font-size: 1rem;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #ededed;
                text-align: center;
                color: #6b7280;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Data Maturity Assessment Report</h1>
            ${reportData.reportInfo.isSingleAssessment ? `
                <p>${reportData.userInfo?.name} • ${reportData.userInfo?.role} • ${reportData.userInfo?.organization}</p>
            ` : `
                <p>${reportData.reportInfo.reportType === 'single' ? 'Individual' : 'Collective'} Assessment Report</p>
                <p>${reportData.reportInfo.codesCount} code(s) • ${reportData.overallStats.totalSessions} session(s)</p>
            `}
            <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="report-info">
            <h2>Assessment Summary</h2>
            <div class="stat">
                <span>Overall Score:</span>
                <strong>${reportData.overallStats.overallScore}/5.0</strong>
            </div>
            <div class="stat">
                <span>Maturity Level:</span>
                <strong>${reportData.overallStats.maturityLevel}</strong>
            </div>
            ${reportData.reportInfo.isSingleAssessment ? `
                <div class="stat">
                    <span>Questions Answered:</span>
                    <strong>${reportData.overallStats.questionsAnswered}/${reportData.overallStats.totalQuestions}</strong>
                </div>
                <div class="stat">
                    <span>Completion Rate:</span>
                    <strong>${reportData.overallStats.completionRate}%</strong>
                </div>
            ` : `
                <div class="stat">
                    <span>Total Sessions:</span>
                    <strong>${reportData.overallStats.totalSessions}</strong>
                </div>
                <div class="stat">
                    <span>Average Completion:</span>
                    <strong>${reportData.overallStats.averageCompletion}%</strong>
                </div>
            `}
        </div>

        <h2>Scores by Dimension</h2>
        ${reportData.subdomainScores.map(subdomain => `
            <div class="subdomain">
                <strong>${subdomain.name}</strong>: ${subdomain.score}/5.0 (${subdomain.maturity_level})
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 0.9rem;">${subdomain.description}</p>
            </div>
        `).join('')}

        ${reportData.maturityAnalysis ? `
            <h2>Maturity Level Analysis</h2>
            <div class="report-info">
                ${reportData.maturityAnalysis.description_en ? `
                    <p style="line-height: 1.6; margin-bottom: 15px;">${reportData.maturityAnalysis.description_en}</p>
                ` : ''}
                ${reportData.maturityAnalysis.indicators_en && reportData.maturityAnalysis.indicators_en.length > 0 ? `
                    <h3>Key Indicators:</h3>
                    <ul>
                        ${reportData.maturityAnalysis.indicators_en.map(indicator => `
                            <li style="margin: 8px 0;">${indicator}</li>
                        `).join('')}
                    </ul>
                ` : ''}
            </div>
        ` : ''}

        ${reportData.generalRecommendations && reportData.generalRecommendations.length > 0 ? `
            <h2>General Recommendations</h2>
            ${reportData.generalRecommendations.map((rec, idx) => `
                <div class="recommendation">
                    <h3>${idx + 1}. ${rec.title}</h3>
                    <p style="margin: 0; line-height: 1.6;">${rec.description}</p>
                </div>
            `).join('')}
        ` : ''}

        ${reportData.roleRecommendations && reportData.roleRecommendations.length > 0 ? `
            <h2>Role-Specific Recommendations</h2>
            ${reportData.roleRecommendations.map((rec, idx) => `
                <div class="recommendation" style="border-left-color: #f5ad2e; background: rgba(245, 173, 46, 0.05);">
                    <h3>${idx + 1}. ${rec.title}</h3>
                    <p style="margin: 0; line-height: 1.6;">${rec.description}</p>
                </div>
            `).join('')}
        ` : ''}

        <div class="footer">
            <p>Omnisight Analytics by Forefront Consulting</p>
            <p><strong>DMA - Data Maturity Assessment</strong></p>
        </div>
    </body>
    </html>
    `;

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="admin-report-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating admin PDF:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate PDF: ' + error.message
    }, { status: 500 });
  }
}

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

    // Get full results data (reuse exact same queries from results API)
    const [sessionRows] = await database.execute(`
      SELECT
        s.*,
        u.name,
        u.email,
        u.organization,
        u.role_title,
        r.title as role_name
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

    // Get subdomain scores
    const [subdomainScores] = await database.execute(`
      SELECT
        sd.id,
        sd.${language === 'ar' ? 'name_ar' : 'name_en'} as name,
        sd.${language === 'ar' ? 'description_ar' : 'description_en'} as description,
        COALESCE(s.raw_score, 0) as score,
        COALESCE(s.percentage_score, 0) as percentage,
        COALESCE(s.questions_answered, 0) as questions_answered,
        COALESCE(s.maturity_level, 'Initial') as maturity_level
      FROM subdomains sd
      LEFT JOIN session_scores s ON sd.id = s.subdomain_id
        AND s.session_id = ?
        AND s.score_type = 'subdomain'
      ORDER BY sd.display_order
    `, [sessionId]);

    // Ensure numeric values for subdomain scores
    subdomainScores.forEach(domain => {
      domain.score = parseFloat(domain.score) || 0;
      domain.percentage = parseFloat(domain.percentage) || 0;
      domain.questions_answered = parseInt(domain.questions_answered) || 0;
    });

    // Get overall score
    const [overallScoreRows] = await database.execute(`
      SELECT raw_score, maturity_level, questions_answered, total_questions
      FROM session_scores
      WHERE session_id = ? AND score_type = 'overall'
    `, [sessionId]);

    const overallScore = overallScoreRows[0];

    // Fetch maturity levels
    const [maturityLevels] = await database.execute(`
      SELECT
        level_number,
        level_name,
        level_description_en,
        level_description_ar,
        score_range_min,
        score_range_max,
        color_code
      FROM maturity_levels
      ORDER BY level_number
    `);

    // Fetch maturity summary
    const [maturitySummaryData] = await database.execute(`
      SELECT
        maturity_summary_description,
        maturity_summary_indicators
      FROM recommendation_metadata
      WHERE session_id = ? AND language = ?
      LIMIT 1
    `, [sessionId, language]);

    const maturitySummary = maturitySummaryData.length > 0 ? {
      description: maturitySummaryData[0].maturity_summary_description,
      keyIndicators: maturitySummaryData[0].maturity_summary_indicators || []
    } : null;

    // Fetch real recommendations from database
    const [recommendationsData] = await database.execute(`
      SELECT
        recommendation_type,
        priority,
        title,
        description,
        display_order
      FROM recommendations
      WHERE session_id = ? AND language = ?
      ORDER BY recommendation_type, display_order
    `, [sessionId, language]);

    // Transform into general and role arrays
    let generalRecommendations = [];
    let roleRecommendations = [];

    if (recommendationsData.length > 0) {
      generalRecommendations = recommendationsData
        .filter(r => r.recommendation_type === 'general')
        .map(r => ({
          priority: r.priority,
          title: r.title,
          description: r.description
        }));

      roleRecommendations = recommendationsData
        .filter(r => r.recommendation_type === 'role')
        .map(r => ({
          priority: r.priority,
          title: r.title,
          description: r.description
        }));
    } else {
      // Fallback to placeholder if no recommendations exist yet
      generalRecommendations = [
        { priority: 'high', title: language === 'ar' ? 'جاري تحليل النتائج...' : 'Analyzing your results...', description: language === 'ar' ? 'سيتم إنشاء توصيات مخصصة بناءً على إجاباتك' : 'Personalized recommendations will be generated based on your responses' }
      ];

      roleRecommendations = [
        { priority: 'high', title: language === 'ar' ? 'جاري تحليل النتائج...' : 'Analyzing your results...', description: language === 'ar' ? 'سيتم إنشاء توصيات مخصصة لدورك' : 'Role-specific recommendations will be generated' }
      ];
    }

    // Calculate overall from subdomains if not in database
    let calculatedOverallScore = 0;
    let calculatedMaturityLevel = 'Initial';
    let totalQuestionsAnswered = 0;

    if (subdomainScores.length > 0) {
      const assessedDomains = subdomainScores.filter(d => d.questions_answered > 0);
      if (assessedDomains.length > 0) {
        const totalScore = assessedDomains.reduce((sum, domain) => sum + parseFloat(domain.score), 0);
        calculatedOverallScore = totalScore / assessedDomains.length;

        // Determine maturity level
        if (calculatedOverallScore >= 4.3) calculatedMaturityLevel = 'Optimized';
        else if (calculatedOverallScore >= 3.5) calculatedMaturityLevel = 'Advanced';
        else if (calculatedOverallScore >= 2.7) calculatedMaturityLevel = 'Defined';
        else if (calculatedOverallScore >= 1.9) calculatedMaturityLevel = 'Developing';
      }
      totalQuestionsAnswered = subdomainScores.reduce((sum, d) => sum + d.questions_answered, 0);
    }

    // Use overall score from DB if available, otherwise use calculated
    const finalOverallScore = overallScore ? parseFloat(overallScore.raw_score) : calculatedOverallScore;
    const finalMaturityLevel = overallScore ? overallScore.maturity_level : calculatedMaturityLevel;
    const finalQuestionsAnswered = overallScore ? parseInt(overallScore.questions_answered) : totalQuestionsAnswered;
    const finalTotalQuestions = parseInt(sessionData.total_questions) || 35;

    // Note: Chart will be displayed as a table in PDF for better compatibility

    // Prepare results data structure (exactly like results page)
    const resultsData = {
      overallScore: parseFloat(finalOverallScore.toFixed(1)),
      maturityLevel: finalMaturityLevel,
      questionsAnswered: finalQuestionsAnswered,
      totalQuestions: finalTotalQuestions,
      completionRate: Math.round((finalQuestionsAnswered / finalTotalQuestions) * 100),
      userData: {
        name: sessionData.name,
        email: sessionData.email,
        organization: sessionData.organization,
        role: sessionData.role_name || sessionData.role_title
      },
      subdomainScores,
      generalRecommendations,
      roleRecommendations
    };
    

    let htmlContent = `
    <!DOCTYPE html>
    <html ${language === 'ar' ? 'dir="rtl"' : ''}>
    <head>
        <meta charset="utf-8">
        <title>Data Maturity Assessment Report</title>
        <style>
            /* CSS Variables matching the results page */
            :root {
                --primary-navy: #0f2c69;
                --accent-orange: #f5ad2e;
                --secondary-blue: #7f7afe;
                --light-gray: #ededed;
                --white: #ffffff;
                --text-primary: #0f2c69;
                --text-secondary: #7f7afe;
                --text-dark: #212529;
                --text-light: #6c757d;
                --success: #28a745;
                --warning: #f5ad2e;
                --danger: #dc3545;
                --info: #7f7afe;
                --font-primary: 'Montserrat', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            * { 
                box-sizing: border-box; 
                margin: 0;
                padding: 0;
            }
            
            body { 
                font-family: var(--font-primary); 
                line-height: 1.5;
                color: var(--text-primary);
                background-color: var(--white);
                font-size: 14px;
            }
            
            .page-container {
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header-section {
                text-align: center;
                margin-bottom: 30px;
                padding: 25px;
                background: linear-gradient(135deg, var(--primary-navy), var(--secondary-blue));
                color: white;
                border-radius: 12px;
                direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            }
            
            .header-section h1 {
                fontSize: 2rem;
                font-weight: 700;
                margin-bottom: 10px;
                font-family: var(--font-primary);
            }
            
            .user-info {
                fontSize: 1.1rem;
                opacity: 0.9;
                font-family: var(--font-primary);
            }

            .results-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }

            .assessment-card {
                background: var(--white);
                border-radius: 12px;
                box-shadow: 0 2px 12px rgba(15, 44, 105, 0.08);
                padding: 20px;
                border-left: 4px solid var(--primary-navy);
            }

            .overall-score-card {
                text-align: center;
                background: linear-gradient(135deg, rgba(15, 44, 105, 0.05), rgba(127, 122, 254, 0.05));
            }

            .circular-progress {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: conic-gradient(var(--secondary-blue) 0deg, var(--secondary-blue) ${resultsData.overallScore * 72}deg, var(--light-gray) ${resultsData.overallScore * 72}deg, var(--light-gray) 360deg);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px;
                position: relative;
            }

            .circular-progress::before {
                content: '';
                width: 75px;
                height: 75px;
                background: white;
                border-radius: 50%;
                position: absolute;
            }

            .score-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--primary-navy);
                position: relative;
                z-index: 1;
            }

            .maturity-level {
                font-size: 1rem;
                font-weight: 600;
                color: var(--secondary-blue);
                margin-bottom: 8px;
            }

            .completion-info {
                font-size: 0.85rem;
                color: var(--text-secondary);
            }

            .stats-card h3 {
                font-size: 1.1rem;
                color: var(--primary-navy);
                margin-bottom: 15px;
                font-family: var(--font-primary);
            }

            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            }

            .stat-row span {
                font-family: var(--font-primary);
            }

            .stat-row strong {
                font-family: var(--font-primary);
            }

            .domain-scores {
                grid-column: 1 / -1;
            }

            .domain-scores h2 {
                font-size: 1.3rem;
                color: var(--primary-navy);
                margin-bottom: 20px;
                text-align: center;
                font-family: var(--font-primary);
            }

            .dimensions-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 15px;
            }

            .dimension-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid var(--light-gray);
                direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            }

            .dimension-info {
                flex: 1;
            }

            .dimension-name {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 3px;
                font-family: var(--font-primary);
            }

            .dimension-desc {
                font-size: 0.8rem;
                color: var(--text-secondary);
                font-family: var(--font-primary);
            }

            .dimension-score {
                text-align: ${language === 'ar' ? 'left' : 'right'};
                margin-left: ${language === 'ar' ? '0' : '12px'};
                margin-right: ${language === 'ar' ? '12px' : '0'};
            }

            .dimension-score-value {
                font-size: 1rem;
                font-weight: 700;
                color: var(--primary-navy);
                font-family: var(--font-primary);
            }

            .dimension-bar {
                width: 60px;
                height: 6px;
                background: var(--light-gray);
                border-radius: 3px;
                overflow: hidden;
                margin-top: 4px;
            }

            .dimension-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-navy), var(--secondary-blue));
                border-radius: 3px;
            }

            .recommendations-section {
                margin-top: 30px;
            }

            .recommendations-card {
                margin-bottom: 25px;
                background: rgba(127, 122, 254, 0.05);
                border-left: ${language === 'ar' ? 'none' : '4px solid var(--secondary-blue)'};
                border-right: ${language === 'ar' ? '4px solid var(--secondary-blue)' : 'none'};
            }

            .role-recommendations-card {
                background: rgba(245, 173, 46, 0.05);
                border-left: ${language === 'ar' ? 'none' : '4px solid var(--accent-orange)'};
                border-right: ${language === 'ar' ? '4px solid var(--accent-orange)' : 'none'};
            }

            .recommendations-card h2 {
                color: var(--secondary-blue);
                margin-bottom: 15px;
                font-family: var(--font-primary);
                text-align: ${language === 'ar' ? 'right' : 'left'};
                font-size: 1.2rem;
            }

            .role-recommendations-card h2 {
                color: var(--accent-orange);
            }

            .recommendation-item {
                margin-bottom: 15px;
                padding: 12px;
                background: white;
                border-radius: 8px;
                border: 1px solid var(--light-gray);
                direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            }

            .recommendation-header {
                font-weight: 600;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
                gap: 6px;
                font-family: var(--font-primary);
                flex-direction: ${language === 'ar' ? 'row-reverse' : 'row'};
            }

            .recommendation-desc {
                color: var(--text-dark);
                font-size: 0.9rem;
                line-height: 1.4;
                font-family: var(--font-primary);
                text-align: ${language === 'ar' ? 'right' : 'left'};
            }


            .footer {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.8rem;
                color: var(--text-light);
                border-top: 1px solid var(--light-gray);
                padding-top: 15px;
                font-family: var(--font-primary);
            }

            .footer-left {
                text-align: left;
            }

            .footer-right {
                text-align: right;
                font-weight: bold;
                color: var(--primary-navy);
            }

            /* Print optimizations */
            @media print {
                .page-container {
                    padding: 0;
                }
                .charts-section {
                    page-break-inside: avoid;
                }
                .recommendations-section {
                    page-break-inside: avoid;
                }

                /* Footer on every page */
                @page {
                    margin-bottom: 60px;
                }

                .page-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    font-size: 0.75rem;
                    color: var(--text-light);
                    border-top: 1px solid var(--light-gray);
                    background: white;
                }
            }

            /* RTL adjustments */
            .rtl {
                direction: rtl;
                text-align: right;
            }

            .rtl .assessment-card {
                border-left: none;
                border-right: 4px solid var(--primary-navy);
            }

            /* Two column layout for score cards */
            .two-column-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }

            /* Page break */
            .page-break {
                page-break-before: always;
            }

        </style>
    </head>
    <body class="${language === 'ar' ? 'rtl' : ''}">
        <div class="page-container">
            <!-- Header Section -->
            <div class="header-section">
                <h1>${language === 'ar' ? 'تقرير تقييم نضج البيانات' : 'Data Maturity Assessment Report'}</h1>
                <div class="user-info">
                    ${resultsData.userData.name} • ${resultsData.userData.role} • ${resultsData.userData.organization}
                </div>
            </div>

            <!-- Two Column: Overall Score & Stats -->
            <div class="two-column-grid">
                <!-- Overall Score Card (50%) -->
                <div class="assessment-card overall-score-card">
                    <h2>${language === 'ar' ? 'نضج البيانات الإجمالي' : 'Overall Data Maturity'}</h2>

                    <div class="circular-progress">
                        <div class="score-value">${resultsData.overallScore}</div>
                    </div>

                    <div class="maturity-level">${resultsData.maturityLevel}</div>

                    <div class="completion-info">
                        ${language === 'ar' ?
                          `بناءً على ${resultsData.questionsAnswered} من أصل ${resultsData.totalQuestions} سؤالاً` :
                          `Based on ${resultsData.questionsAnswered} of ${resultsData.totalQuestions} questions`
                        }
                    </div>
                </div>

                <!-- Quick Stats (50%) -->
                <div class="assessment-card stats-card">
                    <h3>${language === 'ar' ? 'ملخص التقييم' : 'Assessment Summary'}</h3>

                    <div class="stat-row">
                        <span>${language === 'ar' ? 'الأسئلة المُجابة:' : 'Questions Answered:'}</span>
                        <strong>${resultsData.questionsAnswered}/${resultsData.totalQuestions}</strong>
                    </div>

                    <div class="stat-row">
                        <span>${language === 'ar' ? 'معدل الإنجاز:' : 'Completion Rate:'}</span>
                        <strong>${resultsData.completionRate}%</strong>
                    </div>

                    <div class="stat-row">
                        <span>${language === 'ar' ? 'دورك:' : 'Your Role:'}</span>
                        <strong>${resultsData.userData.role}</strong>
                    </div>

                    <div class="stat-row">
                        <span>${language === 'ar' ? 'تم الإنجاز:' : 'Completed:'}</span>
                        <strong>${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</strong>
                    </div>
                </div>
            </div>

            <!-- Understanding Maturity Levels (Full Width) -->
            <div class="assessment-card" style="margin-bottom: 30px;">
                <h2 style="margin-bottom: 20px;">${language === 'ar' ? 'فهم مستويات النضج' : 'Understanding Maturity Levels'}</h2>

                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px;">
                        ${maturityLevels.map(level => {
                          const isCurrentLevel = finalOverallScore >= parseFloat(level.score_range_min) &&
                                                finalOverallScore <= parseFloat(level.score_range_max);
                          return `
                            <div style="padding: 12px; background: ${isCurrentLevel ? 'rgba(127, 122, 254, 0.1)' : '#f8f9fa'}; border: ${isCurrentLevel ? '2px solid #7F7AFE' : '1px solid #e0e0e0'}; border-radius: 8px;">
                                <div style="display: flex; align-items: center; margin-bottom: 8px; gap: 8px;">
                                    <div style="background: ${level.color_code || '#7F7AFE'}; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem; flex-shrink: 0;">
                                        ${level.level_number}
                                    </div>
                                    <div style="font-weight: bold; font-size: 0.85rem; color: #002855; line-height: 1.2;">
                                        ${level.level_name}
                                    </div>
                                </div>
                                <p style="font-size: 0.75rem; color: #666; margin: 0; line-height: 1.4;">
                                    ${language === 'ar' ? level.level_description_ar : level.level_description_en}
                                </p>
                            </div>
                          `;
                        }).join('')}
                    </div>
                </div>

            <!-- NEW PAGE: Domain Scores (Page 2 - first 8 dimensions) -->
            <div class="page-break"></div>
            <div class="assessment-card domain-scores">
                <h2>${language === 'ar' ? 'النقاط حسب البُعد' : 'Scores by Dimension'}</h2>

                    <div class="dimensions-grid">
                        ${resultsData.subdomainScores.slice(0, 8).map((domain, index) => `
                            <div class="dimension-item">
                                <div class="dimension-info">
                                    <div class="dimension-name">${domain.name}</div>
                                    <div class="dimension-desc">${domain.description}</div>
                                </div>

                                <div class="dimension-score">
                                    <div class="dimension-score-value">
                                        ${domain.questions_answered === 0 ?
                                          (language === 'ar' ? 'لم يتم التقييم' : 'Not Assessed') :
                                          domain.score.toFixed(1)
                                        }
                                    </div>
                                    <div class="dimension-bar">
                                        <div class="dimension-fill" style="width: ${domain.questions_answered === 0 ? '0' : domain.percentage}%"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

            <!-- NEW PAGE: Remaining Dimensions + Chart (Page 3) -->
            <div class="page-break"></div>
            <div class="assessment-card domain-scores">
                    <div class="dimensions-grid">
                        ${resultsData.subdomainScores.slice(8).map((domain, index) => `
                            <div class="dimension-item">
                                <div class="dimension-info">
                                    <div class="dimension-name">${domain.name}</div>
                                    <div class="dimension-desc">${domain.description}</div>
                                </div>

                                <div class="dimension-score">
                                    <div class="dimension-score-value">
                                        ${domain.questions_answered === 0 ?
                                          (language === 'ar' ? 'لم يتم التقييم' : 'Not Assessed') :
                                          domain.score.toFixed(1)
                                        }
                                    </div>
                                    <div class="dimension-bar">
                                        <div class="dimension-fill" style="width: ${domain.questions_answered === 0 ? '0' : domain.percentage}%"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Radar Chart Image -->
                <div class="assessment-card" style="margin-top: 30px; text-align: center;">
                    <h3 style="margin-bottom: 20px;">${language === 'ar' ? 'النقاط حسب البُعد' : 'Scores by Dimension'}</h3>
                    <img id="radar-chart-image" src="" alt="${language === 'ar' ? 'مخطط الرادار' : 'Radar Chart'}" style="max-width: 100%; height: auto; display: none;" />
                    <div id="chart-loading" style="padding: 60px; background: #f8f9fa; border-radius: 8px;">
                        <p style="margin: 0; color: #666;">${language === 'ar' ? 'جاري تحميل الرسم البياني...' : 'Loading chart...'}</p>
                    </div>
                </div>

            ${maturitySummary ? `
            <!-- NEW PAGE: Your Maturity Level Analysis -->
            <div class="page-break"></div>
            <div class="assessment-card" style="margin-bottom: 30px; background: linear-gradient(135deg, rgba(127, 122, 254, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border: 2px solid #7F7AFE;">
                <h2 style="color: #7F7AFE; margin-bottom: 20px;">${language === 'ar' ? 'تحليل مستوى النضج الخاص بك' : 'Your Maturity Level Analysis'}</h2>

                <p style="font-size: 1rem; line-height: 1.8; margin-bottom: 25px;">
                    ${maturitySummary.description}
                </p>

                ${maturitySummary.keyIndicators && maturitySummary.keyIndicators.length > 0 ? `
                    <h3 style="color: #002855; margin-bottom: 15px; font-size: 1.1rem;">${language === 'ar' ? 'المؤشرات الرئيسية' : 'Key Indicators'}</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${maturitySummary.keyIndicators.map(indicator => `
                            <li style="margin-bottom: 12px; padding: 12px 15px; background: white; border-radius: 6px; border-${language === 'ar' ? 'right' : 'left'}: 3px solid #7F7AFE; font-size: 0.95rem;">
                                ✓ ${indicator}
                            </li>
                        `).join('')}
                    </ul>
                ` : ''}
            </div>
            ` : ''}

            <!-- Recommendations Section -->
            ${resultsData.generalRecommendations && resultsData.generalRecommendations.length > 0 ? `
                <div class="recommendations-section">
                    <div class="assessment-card recommendations-card">
                        <h2>${language === 'ar' ? 'التوصيات العامة' : 'General Recommendations'}</h2>
                        
                        ${resultsData.generalRecommendations.map(rec => `
                            <div class="recommendation-item">
                                <div class="recommendation-header" style="color: ${getPriorityColor(rec.priority)}">
                                    <span>${getPriorityIcon(rec.priority)}</span>
                                    <span>${rec.title}</span>
                                </div>
                                <div class="recommendation-desc">${rec.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${resultsData.roleRecommendations && resultsData.roleRecommendations.length > 0 ? `
                <div class="recommendations-section">
                    <div class="assessment-card role-recommendations-card">
                        <h2>${language === 'ar' ? 'التوصيات الخاصة بالدور' : 'Role-Specific Recommendations'}</h2>
                        
                        ${resultsData.roleRecommendations.map(rec => `
                            <div class="recommendation-item">
                                <div class="recommendation-header" style="color: ${getPriorityColor(rec.priority)}">
                                    <span>${getPriorityIcon(rec.priority)}</span>
                                    <span>${rec.title}</span>
                                </div>
                                <div class="recommendation-desc">${rec.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

        </div>

        <!-- Footer on every page -->
        <div class="page-footer">
            <div style="text-align: left;">
                <span>Omnisight Analytics by Forefront Consulting</span>
            </div>
            <div style="text-align: right; font-weight: bold; color: var(--primary-navy);">
                <span>DMA</span>
            </div>
        </div>

    </body>
    </html>
    `;

    // Step 1: Capture the radar chart from the results page
    let chartImageBase64 = '';
    try {
      const chartBrowser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const chartPage = await chartBrowser.newPage();
      await chartPage.setViewport({ width: 1200, height: 800 });

      // Navigate to the results page
      const resultsUrl = `http://localhost:3001/dma/results?session=${sessionId}&lang=${language}`;
      await chartPage.goto(resultsUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // Wait for the chart to render
      await chartPage.waitForSelector('#radar-chart-container canvas', { timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Extra wait for animations

      // Take screenshot of the chart
      const chartElement = await chartPage.$('#radar-chart-container canvas');
      if (chartElement) {
        const screenshot = await chartElement.screenshot({ type: 'png' });
        chartImageBase64 = `data:image/png;base64,${screenshot.toString('base64')}`;
        console.log('✓ Chart screenshot captured');
      }

      await chartBrowser.close();
    } catch (error) {
      console.error('Error capturing chart:', error);
      // Continue without chart if capture fails
    }

    // Step 2: Inject the chart into HTML
    if (chartImageBase64) {
      htmlContent = htmlContent.replace(
        'id="radar-chart-image" src=""',
        `id="radar-chart-image" src="${chartImageBase64}"`
      ).replace(
        'style="max-width: 100%; height: auto; display: none;"',
        'style="max-width: 500px; height: auto; display: block; margin: 0 auto;"'
      ).replace(
        '<div id="chart-loading"',
        '<div id="chart-loading" style="display: none;"'
      );
    }

    // Step 3: Generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });

    // Set content and wait for it to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Additional wait for content to render
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });
    
    await browser.close();

    // Return actual PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="data-maturity-report-${sessionId}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate PDF'
    }, { status: 500 });
  }
}