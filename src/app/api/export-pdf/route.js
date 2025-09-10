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

    // Get subdomain scores
    const subdomainScores = await database.all(`
      SELECT 
        sd.id,
        sd.name_${language} as name,
        sd.description_${language} as description,
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

    // Get overall score
    const overallScore = await database.get(`
      SELECT raw_score, maturity_level, questions_answered, total_questions
      FROM session_scores 
      WHERE session_id = ? AND score_type = 'overall'
    `, [sessionId]);

    // Use the same placeholder recommendations as the results page
    const generalRecommendations = [
      { priority: 'high', title: language === 'ar' ? 'جاري تحليل النتائج...' : 'Analyzing your results...', description: language === 'ar' ? 'سيتم إنشاء توصيات مخصصة بناءً على إجاباتك' : 'Personalized recommendations will be generated based on your responses' }
    ];

    const roleRecommendations = [
      { priority: 'high', title: language === 'ar' ? 'جاري تحليل النتائج...' : 'Analyzing your results...', description: language === 'ar' ? 'سيتم إنشاء توصيات مخصصة لدورك' : 'Role-specific recommendations will be generated' }
    ];

    // Prepare results data structure (exactly like results page)
    const resultsData = {
      overallScore: overallScore ? parseFloat(overallScore.raw_score.toFixed(1)) : 0,
      maturityLevel: overallScore ? overallScore.maturity_level : 'Initial',
      questionsAnswered: overallScore ? overallScore.questions_answered : 0,
      totalQuestions: overallScore ? overallScore.total_questions : 35,
      completionRate: overallScore ? Math.round((overallScore.questions_answered / overallScore.total_questions) * 100) : 0,
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
    

    const htmlContent = `
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
                text-align: center;
                font-size: 0.8rem;
                color: var(--text-light);
                border-top: 1px solid var(--light-gray);
                padding-top: 15px;
                font-family: var(--font-primary);
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

            <!-- Results Grid -->
            <div class="results-grid">
                <!-- Overall Score Card -->
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

                <!-- Quick Stats -->
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

                <!-- Domain Scores -->
                <div class="assessment-card domain-scores">
                    <h2>${language === 'ar' ? 'النقاط حسب البُعد' : 'Scores by Dimension'}</h2>
                    
                    <div class="dimensions-grid">
                        ${resultsData.subdomainScores.map((domain, index) => `
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
            </div>


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

            <!-- Footer -->
            <div class="footer">
                <p><strong>${language === 'ar' ? 'تم إنشاء هذا التقرير بواسطة أداة تقييم نضج البيانات' : 'Generated by Data Maturity Assessment Tool'}</strong></p>
                <p>${new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
            </div>
        </div>

    </body>
    </html>
    `;

    // Use Puppeteer to generate PDF with enhanced settings
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
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // Brief wait for content to render
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