'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// Domain group color mapping
const DOMAIN_COLORS = {
  'DATA_LIFECYCLE': {
    border: 'rgba(40, 167, 69, 1)',
    background: 'rgba(40, 167, 69, 0.2)',
    point: 'rgba(40, 167, 69, 1)',
    text: '#28a745'
  },
  'GOVERNANCE_PROTECTION': {
    border: 'rgba(245, 173, 46, 1)',
    background: 'rgba(245, 173, 46, 0.2)',
    point: 'rgba(245, 173, 46, 1)',
    text: '#F5AD2E'
  },
  'ORGANIZATIONAL_ENABLERS': {
    border: 'rgba(15, 44, 105, 1)',
    background: 'rgba(15, 44, 105, 0.2)',
    point: 'rgba(15, 44, 105, 1)',
    text: '#0F2C69'
  }
};

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

  // Recommendations state
  const [recommendations, setRecommendations] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [isCached, setIsCached] = useState(false);

  // Maturity levels state
  const [maturityLevels, setMaturityLevels] = useState([]);

  // Get parameters from URL
  const sessionId = searchParams.get('session');
  const role = searchParams.get('role');
  const lang = searchParams.get('lang') || 'en';

  useEffect(() => {
    setLanguage(lang);
    setCurrentDate(new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'));
    setIsMounted(true);

    // Fetch maturity levels on mount
    fetchMaturityLevels();

    // Fetch recommendations when language changes (if they exist in cache)
    if (sessionId && recommendations) {
      fetchRecommendations(lang);
    }

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

    // Reset loading state and fetch results when language changes
    setLoading(true);
    setError('');
    fetchResults(lang);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkScreenSize);
      }
    };
  }, [sessionId, lang]);

  const fetchResults = async (currentLang = language) => {
    if (!sessionId) {
      setError('Session ID not found');
      setLoading(false);
      return;
    }

    try {
      // Use the passed language parameter to avoid state timing issues
      const response = await fetch(`/api/results?session=${sessionId}&lang=${currentLang}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setResultsData(data.results); // All data comes from database
        // After results are loaded, fetch recommendations (keep loading=true until done)
        await fetchRecommendations(currentLang);
      } else {
        setError(data.error || 'Failed to load results');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const fetchMaturityLevels = async () => {
    try {
      const response = await fetch('/api/maturity-levels');
      const data = await response.json();

      if (data.success) {
        setMaturityLevels(data.levels);
      }
    } catch (error) {
      console.error('Error fetching maturity levels:', error);
    }
  };

  const fetchRecommendations = async (currentLang = language) => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    setRecommendationsLoading(true);
    setRecommendationsError('');

    try {
      const response = await fetch('/api/generate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          language: currentLang
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store full response with both languages
        setRecommendations(data.recommendations);
        setIsCached(data.cached || false);
      } else {
        setRecommendationsError(data.error || 'Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendationsError(currentLang === 'ar' ?
        'خطأ في تحميل التوصيات' :
        'Failed to load recommendations');
    } finally {
      setRecommendationsLoading(false);
      setLoading(false); // Turn off main loading after recommendations are done
    }
  };

  const getContent = () => {
    const content = {
      en: {
        pageTitle: 'Assessment Results',
        loading: 'Generating your personalized recommendations...',
        loadingSubtext: 'This takes about 30 seconds. We\'re analyzing your assessment to provide specific, actionable guidance.',
        overallTitle: 'Overall Data Maturity',
        statsTitle: 'Assessment Summary',
        questionsLabel: 'Questions Answered:',
        completionLabel: 'Completion Rate:',
        roleLabel: 'Your Role:',
        dateLabel: 'Completed:',
        subdomainTitle: 'Scores by Dimension',
        maturityLevelsTitle: 'Understanding Maturity Levels',
        maturityLevel1: 'Initial/Ad-Hoc',
        maturityLevel1Desc: 'Processes are unpredictable, poorly controlled, and reactive.',
        maturityLevel2: 'Managed',
        maturityLevel2Desc: 'Processes are characterized for projects and often reactive.',
        maturityLevel3: 'Defined',
        maturityLevel3Desc: 'Processes are characterized for the organization and proactive.',
        maturityLevel4: 'Quantitatively Managed',
        maturityLevel4Desc: 'Processes are measured and controlled.',
        maturityLevel5: 'Optimizing',
        maturityLevel5Desc: 'Focus on continuous process improvement.',
        maturitySummaryTitle: 'Your Maturity Level Analysis',
        keyIndicatorsTitle: 'Key Indicators',
        generalRecTitle: 'General Recommendations',
        roleRecTitle: 'Role-Specific Recommendations',
        recLoadingTitle: 'Generating Your Personalized Recommendations...',
        recLoadingText: 'This takes about 30 seconds. We\'re analyzing your assessment to provide specific, actionable guidance.',
        recLoadingCached: 'Loading your recommendations...',
        recErrorTitle: 'Unable to Load Recommendations',
        recRetryBtn: 'Try Again',
        recCachedBadge: 'Previously Generated',
        actionsTitle: 'Export & Actions',
        downloadBtn: 'Download PDF Report',
        exportBtn: 'Export Raw Data (CSV)',
        emailBtn: 'Email Results',
        orgAssessmentBtn: 'Request Organization Assessment',
        language: 'Language'
      },
      ar: {
        pageTitle: 'نتائج التقييم',
        loading: 'جاري إنشاء توصياتك الشخصية...',
        loadingSubtext: 'يستغرق هذا حوالي 30 ثانية. نحن نحلل تقييمك لتقديم إرشادات محددة وقابلة للتنفيذ.',
        overallTitle: 'نضج البيانات الإجمالي',
        statsTitle: 'ملخص التقييم',
        questionsLabel: 'الأسئلة المُجابة:',
        completionLabel: 'معدل الإنجاز:',
        roleLabel: 'دورك:',
        dateLabel: 'تم الإنجاز:',
        subdomainTitle: 'النقاط حسب البُعد',
        maturityLevelsTitle: 'فهم مستويات النضج',
        maturityLevel1: 'مبدئي / عشوائي',
        maturityLevel1Desc: 'العمليات غير متوقعة وسيئة التحكم وتفاعلية.',
        maturityLevel2: 'مُدار',
        maturityLevel2Desc: 'العمليات محددة للمشاريع وغالبًا ما تكون تفاعلية.',
        maturityLevel3: 'مُعرّف',
        maturityLevel3Desc: 'العمليات محددة للمؤسسة واستباقية.',
        maturityLevel4: 'مُدار كميًا',
        maturityLevel4Desc: 'العمليات مقاسة ومُتحكم بها.',
        maturityLevel5: 'مُحسّن',
        maturityLevel5Desc: 'التركيز على التحسين المستمر للعمليات.',
        maturitySummaryTitle: 'تحليل مستوى النضج الخاص بك',
        keyIndicatorsTitle: 'المؤشرات الرئيسية',
        generalRecTitle: 'التوصيات العامة',
        roleRecTitle: 'التوصيات الخاصة بالدور',
        recLoadingTitle: 'جاري إنشاء توصياتك الشخصية...',
        recLoadingText: 'يستغرق هذا حوالي 30 ثانية. نحن نقوم بتحليل تقييمك لتقديم إرشادات محددة وقابلة للتنفيذ.',
        recLoadingCached: 'جاري تحميل توصياتك...',
        recErrorTitle: 'تعذر تحميل التوصيات',
        recRetryBtn: 'حاول مرة أخرى',
        recCachedBadge: 'تم إنشاؤها مسبقًا',
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

      // Create loading overlay
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'pdf-loading-overlay';
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 44, 105, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
      `;
      loadingOverlay.innerHTML = `
        <div style="text-align: center;">
          <div style="width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
          <h2 style="margin: 0 0 10px 0; font-size: 1.5rem;">${language === 'ar' ? 'جاري إعداد تقرير PDF...' : 'Preparing PDF Report...'}</h2>
          <p style="margin: 0; opacity: 0.9;">${language === 'ar' ? 'قد يستغرق هذا بضع ثوانٍ، يُرجى الانتظار' : 'This may take a few seconds, please wait'}</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingOverlay);

      // Disable button to prevent multiple clicks
      const button = document.querySelector('button[onClick*="downloadPDF"]');
      if (button) button.disabled = true;

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

      // Remove loading overlay
      document.body.removeChild(loadingOverlay);
      if (button) button.disabled = false;
    } catch (error) {
      console.error('PDF download error:', error);
      alert(language === 'ar' ? 'خطأ في تحميل PDF' : 'Error downloading PDF');

      // Remove loading overlay and re-enable button on error
      const overlay = document.getElementById('pdf-loading-overlay');
      if (overlay) document.body.removeChild(overlay);
      const button = document.querySelector('button[onClick*="downloadPDF"]');
      if (button) button.disabled = false;
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
          <div style={{
            textAlign: 'center',
            paddingTop: '100px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {/* Robot Animation */}
            <div style={{
              fontSize: '64px',
              marginBottom: '30px',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              🤖
            </div>

            {/* Loading Title */}
            <h2 style={{
              fontSize: '1.5rem',
              marginBottom: '15px',
              color: 'var(--primary-navy)',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.loading}
            </h2>

            {/* Loading Subtext */}
            <p style={{
              fontSize: '1rem',
              marginBottom: '30px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-primary)',
              lineHeight: '1.6'
            }}>
              {content.loadingSubtext}
            </p>

            {/* Bouncing Dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '20px'
            }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--secondary-blue)',
                    animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`
                  }}
                />
              ))}
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
                router.push(`/dma/results?session=${sessionId}&role=${role}&lang=${newLang}`);
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
            display: 'flex',
            gap: '30px',
            marginBottom: '40px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            maxWidth: '900px',
            margin: '0 auto 40px'
          }}>

            {/* Overall Score Card */}
            <div className="assessment-card" style={{
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(15, 44, 105, 0.05), rgba(127, 122, 254, 0.05))',
              flex: '1',
              minWidth: '300px',
              padding: '20px'
            }}>
              <h2 style={{
                marginBottom: '15px',
                fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif',
                color: 'var(--primary-navy)',
                fontSize: '1.25rem'
              }}>
                {content.overallTitle}
              </h2>

              {/* Circular Progress */}
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: `conic-gradient(var(--secondary-blue) 0deg, var(--secondary-blue) ${resultsData.overallScore * 72}deg, var(--light-gray) ${resultsData.overallScore * 72}deg, var(--light-gray) 360deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                position: 'relative'
              }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  background: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute'
                }}>
                  <span style={{
                    fontSize: '1.35rem',
                    fontWeight: '700',
                    color: 'var(--primary-navy)',
                    fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif'
                  }}>
                    {resultsData.overallScore}
                  </span>
                </div>
              </div>

              <div style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--secondary-blue)',
                marginBottom: '5px',
                fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif'
              }}>
                {resultsData.maturityLevel}
              </div>

              <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif'
              }}>
                {language === 'ar' ?
                  `بناءً على ${resultsData.questionsAnswered} من أصل ${resultsData.totalQuestions} سؤالاً` :
                  `Based on ${resultsData.questionsAnswered} of ${resultsData.totalQuestions} questions`
                }
              </div>
            </div>

            {/* Quick Stats */}
            <div className="assessment-card" style={{
              flex: '1',
              minWidth: '300px',
              padding: '20px'
            }}>
              <h2 style={{
                marginBottom: '15px',
                fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif',
                color: 'var(--primary-navy)',
                textAlign: 'center',
                fontSize: '1.25rem'
              }}>
                {content.statsTitle}
              </h2>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                direction: language === 'ar' ? 'rtl' : 'ltr',
                fontSize: '0.85rem'
              }}>
                <span style={{ fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif' }}>{content.questionsLabel}</span>
                <strong style={{ fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif' }}>
                  {resultsData.questionsAnswered}/{resultsData.totalQuestions}
                </strong>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                direction: language === 'ar' ? 'rtl' : 'ltr',
                fontSize: '0.85rem'
              }}>
                <span style={{ fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif' }}>{content.completionLabel}</span>
                <strong style={{ fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif' }}>{resultsData.completionRate}%</strong>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                direction: language === 'ar' ? 'rtl' : 'ltr',
                fontSize: '0.85rem'
              }}>
                <span style={{ fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif' }}>{content.roleLabel}</span>
                <strong style={{ fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif' }}>{resultsData.userData.role}</strong>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                direction: language === 'ar' ? 'rtl' : 'ltr',
                fontSize: '0.85rem'
              }}>
                <span style={{ fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif' }}>{content.dateLabel}</span>
                <strong style={{ fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif' }}>
                  {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </strong>
              </div>
            </div>
          </div>

          {/* Maturity Levels Definitions */}
          {maturityLevels.length > 0 && (
            <div className="assessment-card" style={{ marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '1.5rem',
                color: 'var(--primary-navy)',
                marginBottom: '20px',
                textAlign: language === 'ar' ? 'right' : 'left',
                fontFamily: 'var(--font-primary)'
              }}>
                {content.maturityLevelsTitle}
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                {maturityLevels.map(level => {
                  const isCurrentLevel = resultsData.overallScore >= parseFloat(level.score_range_min) &&
                                        resultsData.overallScore <= parseFloat(level.score_range_max);

                  return (
                    <div key={level.level_number} style={{
                      padding: '15px',
                      backgroundColor: isCurrentLevel ? 'rgba(127, 122, 254, 0.1)' : '#f8f9fa',
                      border: isCurrentLevel ? '2px solid var(--secondary-blue)' : '1px solid #e0e0e0',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '8px',
                        gap: '10px'
                      }}>
                        <div style={{
                          backgroundColor: level.color_code || 'var(--secondary-blue)',
                          color: 'white',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}>
                          {level.level_number}
                        </div>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          color: 'var(--primary-navy)',
                          fontFamily: 'var(--font-primary)'
                        }}>
                          {level.level_name}
                        </div>
                      </div>
                      <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: '1.5',
                        fontFamily: 'var(--font-primary)',
                        textAlign: language === 'ar' ? 'right' : 'left'
                      }}>
                        {language === 'ar' ? level.level_description_ar : level.level_description_en}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Radar Chart - Full Width */}
          <div className="assessment-card" style={{ marginBottom: '30px' }} id="radar-chart-container">
            <h2 style={{
              fontSize: '1.5rem',
              color: 'var(--primary-navy)',
              marginBottom: '20px',
              textAlign: 'center',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.subdomainTitle}
            </h2>

            {resultsData.subdomainScores && resultsData.subdomainScores.length > 0 && (
              <div style={{
                maxWidth: '450px',
                margin: '0 auto 30px',
                padding: '15px'
              }}>
                <Radar
                  data={{
                    labels: resultsData.subdomainScores.map(d => d.name),
                    datasets: [{
                      label: language === 'ar' ? 'النتيجة' : 'Score',
                      data: resultsData.subdomainScores.map(d =>
                        d.questions_answered === 0 ? 0 : parseFloat(d.score) || 0
                      ),
                      backgroundColor: 'rgba(127, 122, 254, 0.15)',
                      borderColor: 'rgba(127, 122, 254, 1)',
                      borderWidth: 2,
                      pointBackgroundColor: resultsData.subdomainScores.map(d => DOMAIN_COLORS[d.domain_id]?.point || 'rgba(127, 122, 254, 1)'),
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: resultsData.subdomainScores.map(d => DOMAIN_COLORS[d.domain_id]?.border || 'rgba(127, 122, 254, 1)'),
                      pointRadius: 5,
                      pointHoverRadius: 7,
                      tension: 0.3
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                      r: {
                        min: 0,
                        max: 5,
                        ticks: {
                          stepSize: 1,
                          font: {
                            family: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif',
                            size: 11
                          }
                        },
                        pointLabels: {
                          font: {
                            family: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif',
                            size: 12,
                            weight: '600'
                          },
                          color: resultsData.subdomainScores.map(d => DOMAIN_COLORS[d.domain_id]?.text || '#0f2c69')
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        },
                        angleLines: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: function(context) {
                            return `${language === 'ar' ? 'النتيجة' : 'Score'}: ${context.parsed.r.toFixed(1)}`;
                          }
                        },
                        bodyFont: {
                          family: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif'
                        }
                      }
                    }
                  }}
                />
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(auto-fit, minmax(350px, 1fr))' : '1fr',
              gap: '20px',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
                {resultsData.subdomainScores && resultsData.subdomainScores.map((domain, index) => {
                  const domainColor = DOMAIN_COLORS[domain.domain_id];
                  return (
                  <div key={domain.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '15px',
                    borderLeft: language === 'ar' ? 'none' : `4px solid ${domainColor?.text || '#7F7AFE'}`,
                    borderRight: language === 'ar' ? `4px solid ${domainColor?.text || '#7F7AFE'}` : 'none',
                    borderBottom: index < resultsData.subdomainScores.length - 1 ? '1px solid var(--light-gray)' : 'none',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    background: domain.questions_answered === 0 ? 'transparent' : `${domainColor?.background || 'rgba(127, 122, 254, 0.05)'}`,
                    borderRadius: '8px',
                    marginBottom: '10px',
                    width: '100%',
                    maxWidth: '450px'
                  }}>
                    <div style={{ flex: '1' }}>
                      <div style={{
                        fontWeight: '600',
                        color: domainColor?.text || 'var(--text-primary)',
                        marginBottom: '5px',
                        fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif'
                      }}>
                        {domain.name}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: domainColor?.text || 'var(--text-secondary)',
                        fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif',
                        opacity: 0.7
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
                        color: domainColor?.text || 'var(--primary-navy)',
                        fontFamily: language === 'ar' ? 'Tahoma, sans-serif' : 'Montserrat, sans-serif'
                      }}>
                        {domain.questions_answered === 0 ?
                          (language === 'ar' ? 'لم يتم التقييم' : 'Not Assessed') :
                          (typeof domain.score === 'number' ? domain.score.toFixed(1) : parseFloat(domain.score || 0).toFixed(1))
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
                            domainColor?.border || 'linear-gradient(90deg, var(--primary-navy), var(--secondary-blue))',
                          borderRadius: '4px',
                          width: domain.questions_answered === 0 ? '100%' : `${domain.percentage}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                  );
                })}
            </div>
          </div>

          {/* Recommendations Section - Error State */}
          {recommendationsError && (
            <div className="assessment-card" style={{
              marginBottom: '30px',
              background: 'rgba(220, 53, 69, 0.05)',
              borderLeft: language === 'ar' ? 'none' : '4px solid var(--danger)',
              borderRight: language === 'ar' ? '4px solid var(--danger)' : 'none',
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
              <h2 style={{
                color: 'var(--danger)',
                marginBottom: '15px',
                fontFamily: 'var(--font-primary)'
              }}>
                {content.recErrorTitle}
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                marginBottom: '20px'
              }}>
                {recommendationsError}
              </p>
              <button
                onClick={() => fetchRecommendations(language)}
                className="btn-primary"
                style={{
                  width: 'auto',
                  minWidth: '200px',
                  padding: '12px 24px'
                }}
              >
                {content.recRetryBtn}
              </button>
            </div>
          )}

          {/* Recommendations Section - Success State */}
          {recommendations && !recommendationsError && (
            <>
              {/* Badge showing if cached */}
              {isCached && (
                <div style={{
                  textAlign: language === 'ar' ? 'right' : 'left',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: 'rgba(40, 167, 69, 0.1)',
                    color: 'var(--success)',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}>
                    ✓ {content.recCachedBadge}
                  </span>
                </div>
              )}

              {/* Maturity Summary */}
              {recommendations.maturitySummary && (
                <div className="assessment-card" style={{
                  marginBottom: '30px',
                  background: 'linear-gradient(135deg, rgba(127, 122, 254, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '2px solid var(--secondary-blue)',
                  boxShadow: '0 4px 12px rgba(127, 122, 254, 0.1)'
                }}>
                  <h2 style={{
                    color: 'var(--secondary-blue)',
                    marginBottom: '20px',
                    fontFamily: 'var(--font-primary)',
                    textAlign: language === 'ar' ? 'right' : 'left',
                    fontSize: '1.4rem'
                  }}>
                    {content.maturitySummaryTitle}
                  </h2>

                  <p style={{
                    fontSize: '1rem',
                    lineHeight: '1.8',
                    color: 'var(--text-primary)',
                    marginBottom: '25px',
                    fontFamily: 'var(--font-primary)',
                    textAlign: language === 'ar' ? 'right' : 'left',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}>
                    {recommendations.maturitySummary.description}
                  </p>

                  {recommendations.maturitySummary.keyIndicators && recommendations.maturitySummary.keyIndicators.length > 0 && (
                    <>
                      <h3 style={{
                        color: 'var(--primary-navy)',
                        marginBottom: '15px',
                        fontFamily: 'var(--font-primary)',
                        textAlign: language === 'ar' ? 'right' : 'left',
                        fontSize: '1.1rem'
                      }}>
                        {content.keyIndicatorsTitle}
                      </h3>

                      <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        direction: language === 'ar' ? 'rtl' : 'ltr'
                      }}>
                        {recommendations.maturitySummary.keyIndicators.map((indicator, index) => (
                          <li key={index} style={{
                            marginBottom: '12px',
                            padding: '12px 15px',
                            background: 'white',
                            borderRadius: '6px',
                            borderLeft: language === 'ar' ? 'none' : '3px solid var(--secondary-blue)',
                            borderRight: language === 'ar' ? '3px solid var(--secondary-blue)' : 'none',
                            fontFamily: 'var(--font-primary)',
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            textAlign: language === 'ar' ? 'right' : 'left'
                          }}>
                            ✓ {indicator}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

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

                {recommendations.general && recommendations.general.map((rec, index) => (
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

                {recommendations.role && recommendations.role.map((rec, index) => (
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
            </>
          )}

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
                disabled={isDownloading || !recommendations}
                className="btn-primary"
                style={{
                  opacity: (isDownloading || !recommendations) ? 0.6 : 1,
                  cursor: (isDownloading || !recommendations) ? 'not-allowed' : 'pointer'
                }}
                title={!recommendations ? (language === 'ar' ? 'جاري تحميل التوصيات...' : 'Loading recommendations...') : ''}
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