'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Component that uses useSearchParams - this will be wrapped in Suspense
function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState(null);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Get parameters from URL
  const sessionId = searchParams.get('session');
  const role = searchParams.get('role');
  const lang = searchParams.get('lang') || 'en';

  useEffect(() => {
    setLanguage(lang);
    setCurrentDate(new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'));
    setIsMounted(true);
    
    // Set up responsive behavior
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setIsDesktop(window.innerWidth > 768);
      }
    };

    checkScreenSize();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkScreenSize);
    }

    fetchResults();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkScreenSize);
      }
    };
  }, [sessionId, lang]);

  const fetchResults = async () => {
    if (!sessionId) {
      setError('Session ID not found');
      setLoading(false);
      return;
    }

    try {
      // API call to get results from database
      const response = await fetch(`/api/results?session=${sessionId}&lang=${language}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        setResultsData(data.results); // All data comes from database
      } else {
        setError(data.error || 'Failed to load results');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getContent = () => {
    const content = {
      en: {
        pageTitle: 'Assessment Results',
        loading: 'Loading your results...',
        overallTitle: 'Overall Data Maturity',
        statsTitle: 'Assessment Summary',
        questionsLabel: 'Questions Answered:',
        completionLabel: 'Completion Rate:',
        roleLabel: 'Your Role:',
        dateLabel: 'Completed:',
        subdomainTitle: 'Scores by Dimension',
        generalRecTitle: 'General Recommendations',
        roleRecTitle: 'Role-Specific Recommendations',
        actionsTitle: 'Export & Actions',
        downloadBtn: 'Download PDF Report',
        exportBtn: 'Export Raw Data (CSV)',
        emailBtn: 'Email Results',
        orgAssessmentBtn: 'Request Organization Assessment',
        language: 'Language'
      },
      ar: {
        pageTitle: 'نتائج التقييم',
        loading: 'جاري تحميل نتائجك...',
        overallTitle: 'نضج البيانات الإجمالي',
        statsTitle: 'ملخص التقييم',
        questionsLabel: 'الأسئلة المُجابة:',
        completionLabel: 'معدل الإنجاز:',
        roleLabel: 'دورك:',
        dateLabel: 'تم الإنجاز:',
        subdomainTitle: 'النقاط حسب البُعد',
        generalRecTitle: 'التوصيات العامة',
        roleRecTitle: 'التوصيات الخاصة بالدور',
        actionsTitle: 'التصدير والإجراءات',
        downloadBtn: 'تحميل تقرير PDF',
        exportBtn: 'تصدير البيانات الأولية (CSV)',
        emailBtn: 'إرسال النتائج بالبريد',
        orgAssessmentBtn: 'طلب تقييم المنظمة',
        language: 'اللغة'
      }
    };
    return content[language];
  };

  const content = getContent();

  // Helper functions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--danger)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  // Export functions
  const downloadPDF = async () => {
    try {
      if (!sessionId) {
        alert(language === 'ar' ? 'معرف الجلسة غير موجود' : 'Session ID not found');
        return;
      }

      // Show loading indicator
      const originalText = document.querySelector('button[onClick*="downloadPDF"]')?.textContent;
      const button = document.querySelector('button[onClick*="downloadPDF"]');
      if (button) button.textContent = language === 'ar' ? 'جاري الإنشاء...' : 'Generating...';

      const response = await fetch(`/api/export-pdf?session=${sessionId}&lang=${language}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `data-maturity-report-${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate PDF');
      }

      // Restore button text
      if (button && originalText) button.textContent = originalText;
    } catch (error) {
      console.error('PDF download error:', error);
      alert(language === 'ar' ? 'خطأ في تحميل PDF' : 'Error downloading PDF');
      
      // Restore button text on error
      const button = document.querySelector('button[onClick*="downloadPDF"]');
      const originalText = language === 'ar' ? 'تحميل تقرير PDF' : 'Download PDF Report';
      if (button) button.textContent = originalText;
    }
  };

  const exportData = async () => {
    try {
      // TODO: Implement data export API
      alert(language === 'ar' ? 'جاري تصدير البيانات...' : 'Exporting data...');
    } catch (error) {
      alert(language === 'ar' ? 'خطأ في تصدير البيانات' : 'Error exporting data');
    }
  };

  const emailResults = async () => {
    const email = prompt(language === 'ar' ? 'أدخل عنوان البريد الإلكتروني:' : 'Enter email address:');
    if (email) {
      try {
        // TODO: Implement email API
        alert(language === 'ar' ? 
          `جاري إرسال النتائج إلى ${email}...` : 
          `Sending results to ${email}...`);
      } catch (error) {
        alert(language === 'ar' ? 'خطأ في الإرسال' : 'Error sending email');
      }
    }
  };

  const requestOrgAssessment = () => {
    // TODO: Implement organization assessment request form
    alert(language === 'ar' ? 
      'سيتم إضافة نموذج طلب تقييم المنظمة قريباً' : 
      'Organization assessment request form will be added soon');
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
              {content.loading}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !resultsData) {
    return (
      <div className="page-container">
        <div className="container">
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '20px', fontFamily: 'var(--font-primary)' }}>
              {language === 'ar' ? 'خطأ في تحميل النتائج' : 'Error Loading Results'}
            </h2>
            <p style={{ marginBottom: '30px', color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
              {error || (language === 'ar' ? 'تعذر تحميل نتائج التقييم' : 'Unable to load assessment results')}
            </p>
            <button onClick={() => router.push('/')} className="btn-primary">
              {language === 'ar' ? 'العودة للرئيسية' : 'Return to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-container ${language === 'ar' ? 'rtl' : ''}`}>
      <div className="container">
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '20px' }}>
          
          {/* Language Selector */}
          <div style={{ 
            textAlign: language === 'ar' ? 'left' : 'right', 
            marginBottom: '20px' 
          }}>
            <span style={{ 
              marginRight: language === 'ar' ? '0' : '10px',
              marginLeft: language === 'ar' ? '10px' : '0',
              fontFamily: 'var(--font-primary)' 
            }}>
              {content.language}:
            </span>
            <select 
              value={language} 
              onChange={(e) => {
                const newLang = e.target.value;
                router.push(`/results?session=${sessionId}&role=${role}&lang=${newLang}`);
              }}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '6px', 
                border: '2px solid var(--accent-orange)',
                fontFamily: 'var(--font-primary)',
                backgroundColor: 'white'
              }}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* Page Header */}
          <div style={{ 
            textAlign: 'center',
            marginBottom: '40px',
            padding: '30px',
            background: 'linear-gradient(135deg, var(--primary-navy), var(--secondary-blue))',
            color: 'white',
            borderRadius: '12px',
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}>
            <h1 style={{ 
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '10px',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.pageTitle}
            </h1>
            <div style={{ 
              fontSize: '1.1rem',
              opacity: '0.9',
              fontFamily: 'var(--font-primary)'
            }}>
              {resultsData.userData.name} • {resultsData.userData.role} • {resultsData.userData.organization}
            </div>
          </div>

          {/* Results Grid */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
            gap: '30px',
            marginBottom: '40px'
          }}>
            
            {/* Overall Score Card */}
            <div className="assessment-card" style={{ 
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(15, 44, 105, 0.05), rgba(127, 122, 254, 0.05))'
            }}>
              <h2 style={{ 
                marginBottom: '20px',
                fontFamily: 'var(--font-primary)',
                color: 'var(--primary-navy)'
              }}>
                {content.overallTitle}
              </h2>
              
              {/* Circular Progress */}
              <div style={{ 
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(var(--secondary-blue) 0deg, var(--secondary-blue) ${resultsData.overallScore * 72}deg, var(--light-gray) ${resultsData.overallScore * 72}deg, var(--light-gray) 360deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                position: 'relative'
              }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  background: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute'
                }}>
                  <span style={{ 
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    color: 'var(--primary-navy)',
                    fontFamily: 'var(--font-primary)'
                  }}>
                    {resultsData.overallScore}
                  </span>
                </div>
              </div>
              
              <div style={{ 
                fontSize: '1.2rem',
                fontWeight: '600',
                color: 'var(--secondary-blue)',
                marginBottom: '10px',
                fontFamily: 'var(--font-primary)'
              }}>
                {resultsData.maturityLevel}
              </div>
              
              <div style={{ 
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-primary)'
              }}>
                {language === 'ar' ? 
                  `بناءً على ${resultsData.questionsAnswered} من أصل ${resultsData.totalQuestions} سؤالاً` :
                  `Based on ${resultsData.questionsAnswered} of ${resultsData.totalQuestions} questions`
                }
              </div>
            </div>

            {/* Quick Stats */}
            <div className="assessment-card">
              <h3 style={{ 
                marginBottom: '20px',
                fontFamily: 'var(--font-primary)',
                color: 'var(--primary-navy)'
              }}>
                {content.statsTitle}
              </h3>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '15px',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                <span style={{ fontFamily: 'var(--font-primary)' }}>{content.questionsLabel}</span>
                <strong style={{ fontFamily: 'var(--font-primary)' }}>
                  {resultsData.questionsAnswered}/{resultsData.totalQuestions}
                </strong>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '15px',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                <span style={{ fontFamily: 'var(--font-primary)' }}>{content.completionLabel}</span>
                <strong style={{ fontFamily: 'var(--font-primary)' }}>{resultsData.completionRate}%</strong>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '15px',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                <span style={{ fontFamily: 'var(--font-primary)' }}>{content.roleLabel}</span>
                <strong style={{ fontFamily: 'var(--font-primary)' }}>{resultsData.userData.role}</strong>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                <span style={{ fontFamily: 'var(--font-primary)' }}>{content.dateLabel}</span>
                <strong style={{ fontFamily: 'var(--font-primary)' }}>
                  {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </strong>
              </div>
            </div>
          </div>

          {/* Domain Scores - Full Width */}
          <div className="assessment-card" style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              fontSize: '1.5rem',
              color: 'var(--primary-navy)',
              marginBottom: '20px',
              textAlign: 'center',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.subdomainTitle}
            </h2>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(auto-fit, minmax(350px, 1fr))' : '1fr',
              gap: '20px'
            }}>
                {resultsData.subdomainScores && resultsData.subdomainScores.map((domain, index) => (
                  <div key={domain.id} style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '15px 0',
                    borderBottom: index < resultsData.subdomainScores.length - 1 ? '1px solid var(--light-gray)' : 'none',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}>
                    <div style={{ flex: '1' }}>
                      <div style={{ 
                        fontWeight: '600',
                        color: domain.questions_answered === 0 ? 'var(--text-light)' : 'var(--text-primary)',
                        marginBottom: '5px',
                        fontFamily: 'var(--font-primary)'
                      }}>
                        {domain.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-primary)'
                      }}>
                        {domain.description}
                      </div>
                    </div>
                    
                    <div style={{ 
                      textAlign: language === 'ar' ? 'left' : 'right',
                      marginLeft: language === 'ar' ? '0' : '15px',
                      marginRight: language === 'ar' ? '15px' : '0'
                    }}>
                      <div style={{ 
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: domain.questions_answered === 0 ? 'var(--text-light)' : 'var(--primary-navy)',
                        fontFamily: 'var(--font-primary)'
                      }}>
                        {domain.questions_answered === 0 ? 
                          (language === 'ar' ? 'لم يتم التقييم' : 'Not Assessed') :
                          domain.score.toFixed(1)
                        }
                      </div>
                      <div style={{ 
                        width: '80px',
                        height: '8px',
                        background: 'var(--light-gray)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginTop: '5px'
                      }}>
                        <div style={{ 
                          height: '100%',
                          background: domain.questions_answered === 0 ? 
                            'repeating-linear-gradient(45deg, var(--light-gray), var(--light-gray) 5px, white 5px, white 10px)' :
                            'linear-gradient(90deg, var(--primary-navy), var(--secondary-blue))',
                          borderRadius: '4px',
                          width: domain.questions_answered === 0 ? '100%' : `${domain.percentage}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* General Recommendations */}
          <div className="assessment-card" style={{ 
            marginBottom: '30px',
            background: 'rgba(127, 122, 254, 0.05)',
            borderLeft: language === 'ar' ? 'none' : '4px solid var(--secondary-blue)',
            borderRight: language === 'ar' ? '4px solid var(--secondary-blue)' : 'none'
          }}>
            <h2 style={{ 
              color: 'var(--secondary-blue)',
              marginBottom: '20px',
              fontFamily: 'var(--font-primary)',
              textAlign: language === 'ar' ? 'right' : 'left'
            }}>
              {content.generalRecTitle}
            </h2>
            
            {resultsData.generalRecommendations && resultsData.generalRecommendations.map((rec, index) => (
              <div key={index} style={{ 
                marginBottom: '20px',
                padding: '15px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid var(--light-gray)',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                <div style={{ 
                  fontWeight: '600',
                  color: getPriorityColor(rec.priority),
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-primary)',
                  flexDirection: language === 'ar' ? 'row-reverse' : 'row'
                }}>
                  <span>{getPriorityIcon(rec.priority)}</span>
                  <span>{rec.title}</span>
                </div>
                <div style={{ 
                  color: 'var(--text-dark)',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  fontFamily: 'var(--font-primary)',
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  {rec.description}
                </div>
              </div>
            ))}
          </div>

          {/* Role-Specific Recommendations */}
          <div className="assessment-card" style={{ 
            marginBottom: '30px',
            background: 'rgba(245, 173, 46, 0.05)',
            borderLeft: language === 'ar' ? 'none' : '4px solid var(--accent-orange)',
            borderRight: language === 'ar' ? '4px solid var(--accent-orange)' : 'none'
          }}>
            <h2 style={{ 
              color: 'var(--accent-orange)',
              marginBottom: '20px',
              fontFamily: 'var(--font-primary)',
              textAlign: language === 'ar' ? 'right' : 'left'
            }}>
              {content.roleRecTitle}
            </h2>
            
            {resultsData.roleRecommendations && resultsData.roleRecommendations.map((rec, index) => (
              <div key={index} style={{ 
                marginBottom: '20px',
                padding: '15px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid var(--light-gray)',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                <div style={{ 
                  fontWeight: '600',
                  color: getPriorityColor(rec.priority),
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-primary)',
                  flexDirection: language === 'ar' ? 'row-reverse' : 'row'
                }}>
                  <span>{getPriorityIcon(rec.priority)}</span>
                  <span>{rec.title}</span>
                </div>
                <div style={{ 
                  color: 'var(--text-dark)',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  fontFamily: 'var(--font-primary)',
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  {rec.description}
                </div>
              </div>
            ))}
          </div>

          {/* Actions Section */}
          <div style={{ 
            textAlign: 'center',
            marginTop: '40px',
            padding: '30px',
            background: 'var(--light-gray)',
            borderRadius: '12px'
          }}>
            <h3 style={{ 
              color: 'var(--primary-navy)',
              marginBottom: '20px',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.actionsTitle}
            </h3>
            
            <div style={{ 
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              <button 
                onClick={downloadPDF} 
                disabled={isDownloading}
                className="btn-primary"
                style={{
                  opacity: isDownloading ? 0.6 : 1,
                  cursor: isDownloading ? 'not-allowed' : 'pointer'
                }}
              >
                <span style={{ marginRight: language === 'ar' ? '0' : '8px', marginLeft: language === 'ar' ? '8px' : '0' }}>📄</span>
                {isDownloading ? (language === 'ar' ? 'جاري الإنشاء...' : 'Generating...') : content.downloadBtn}
              </button>
              
              <button onClick={exportData} className="btn-secondary">
                <span style={{ marginRight: language === 'ar' ? '0' : '8px', marginLeft: language === 'ar' ? '8px' : '0' }}>📊</span>
                {content.exportBtn}
              </button>
              
              <button onClick={emailResults} className="btn-primary" style={{ background: 'var(--success)' }}>
                <span style={{ marginRight: language === 'ar' ? '0' : '8px', marginLeft: language === 'ar' ? '8px' : '0' }}>✉️</span>
                {content.emailBtn}
              </button>
              
              <button onClick={requestOrgAssessment} className="btn-primary" style={{ background: 'var(--warning)' }}>
                <span style={{ marginRight: language === 'ar' ? '0' : '8px', marginLeft: language === 'ar' ? '8px' : '0' }}>🏢</span>
                {content.orgAssessmentBtn}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper - this is what gets exported
export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsPageContent />
    </Suspense>
  );
}