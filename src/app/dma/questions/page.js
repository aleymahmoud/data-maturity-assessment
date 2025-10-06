'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AssessmentPageContent() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allResponses, setAllResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userId, setUserId] = useState('');
  const [assessmentCode, setAssessmentCode] = useState('');
  const [resumeUserData, setResumeUserData] = useState(null);
  const [isResuming, setIsResuming] = useState(false);

  const initializationRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('lang') || 'en';
  const role = searchParams.get('role') || '';
  const questionParam = parseInt(searchParams.get('question') || '0');

  // Language-specific text - Memoized to prevent re-creation
  const getText = useCallback((key) => {
    const texts = {
      en: {
        loading: 'Loading questions...',
        error: 'Error Loading Questions',
        tryAgain: 'Try Again',
        progress: 'Progress',
        complete: 'Complete',
        question: 'Question',
        of: 'of',
        answered: 'answered',
        scenario: 'Scenario',
        previous: 'Previous',
        next: 'Next',
        finish: 'Finish Assessment',
        welcomeBack: 'Welcome back',
        continuingAssessment: 'Continuing your assessment from where you left off.',
        submitting: 'Submitting...',
        backToRole: 'Back to Role Selection',
        language: 'Language',
        submitError: 'Failed to submit assessment. Please try again.',
        allQuestionsRequired: 'Please answer all questions before submitting.'
      },
      ar: {
        loading: 'جاري تحميل الأسئلة...',
        error: 'خطأ في تحميل الأسئلة',
        tryAgain: 'حاول مرة أخرى',
        progress: 'التقدم',
        complete: 'مكتمل',
        question: 'السؤال',
        of: 'من',
        answered: 'تمت الإجابة عليه',
        scenario: 'السيناريو',
        previous: 'السابق',
        next: 'التالي',
        finish: 'إنهاء التقييم',
        welcomeBack: 'مرحباً بعودتك',
        continuingAssessment: 'متابعة تقييمك من حيث توقفت.',
        submitting: 'جاري الإرسال...',
        backToRole: 'العودة لاختيار الدور',
        language: 'اللغة',
        submitError: 'فشل في إرسال التقييم. يرجى المحاولة مرة أخرى.',
        allQuestionsRequired: 'يرجى الإجابة على جميع الأسئلة قبل الإرسال.'
      }
    };
    return texts[language][key] || texts.en[key];
  }, [language]);

  const fetchQuestions = useCallback(async () => {
    try {
      const code = sessionStorage.getItem('assessmentCode');
      const response = await fetch(`/api/questions?lang=${language}&code=${code}`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
      } else {
        setError('Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Network error. Please try again.');
    }
  }, [language]);

const initializeAssessment = useCallback(async () => {
  try {
    setLoading(true);

    // Check if we're resuming from code entry
    const isResumingFromCode = searchParams.get('resume') === 'true';
    const sessionIdFromUrl = searchParams.get('session');
    
    let sessionCode = '';
    let userData = null;
    let selectedRole = null;
    
    if (isResumingFromCode && sessionIdFromUrl) {
      // Resuming from code entry - get stored resume data
      const resumeDataStr = sessionStorage.getItem('resumeData');

      if (!resumeDataStr) {
        // No resume data found, fall back to regular flow
        // Remove resume parameters and continue with normal session creation
        const cleanUrl = `/assessment?lang=${language}`;
        router.replace(cleanUrl);

        // Set flag to continue with regular flow below
        sessionCode = sessionStorage.getItem('assessmentCode');
        userData = sessionStorage.getItem('userData');
        selectedRole = sessionStorage.getItem('selectedRole');
      } else {
      
      const resumeData = JSON.parse(resumeDataStr);
      sessionCode = sessionStorage.getItem('assessmentCode');
      
      // Set resume state
      setIsResuming(true);
      setResumeUserData(resumeData.userData);
      setSessionId(resumeData.sessionId);
      setAssessmentCode(sessionCode);
      
      // Extract role from roleTitle for URL
      const roleMapping = {
        'CEO': 'executive',
        'COO': 'executive', 
        'CTO': 'executive',
        'CDO': 'executive',
        'VP Strategy': 'executive',
        'IT Director': 'it-technology',
        'Data Engineer': 'it-technology',
        'System Admin': 'it-technology',
        'Program Manager': 'operations',
        'Operations Director': 'operations',
        'Data Analyst': 'analytics',
        'Business Intelligence': 'analytics',
        'Researcher': 'analytics',
        'Compliance Officer': 'compliance',
        'Risk Manager': 'compliance',
        'Legal': 'compliance'
      };
      
      // Find role or default to 'executive'
      const detectedRole = Object.keys(roleMapping).find(key => 
        resumeData.userData.roleTitle.toLowerCase().includes(key.toLowerCase())
      );
      selectedRole = roleMapping[detectedRole] || 'executive';
      
      // Update URL to include role
      router.replace(`/assessment?lang=${language}&role=${selectedRole}&question=0&resume=true&session=${sessionIdFromUrl}`);

      // For resume, skip session creation since session already exists
      await fetchQuestions();
      return;
      }
    } else {
      // Regular flow - get stored session data
      userData = sessionStorage.getItem('userData');
      selectedRole = sessionStorage.getItem('selectedRole');
      sessionCode = sessionStorage.getItem('assessmentCode');

      if (!userData || !selectedRole || !sessionCode) {
        router.push(`/dma/role-selection?lang=${language}`);
        return;
      }

      setAssessmentCode(sessionCode);
      setIsResuming(false);
    }

    // Common session creation for non-resume flows
    if (!isResuming && userData && sessionCode) {
      const sessionResponse = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          userData: JSON.parse(userData),
          language: language
        })
      });

      const sessionData = await sessionResponse.json();

      if (!sessionData.success) {
        setError(sessionData.error || 'Failed to initialize session');
        return;
      }

      setSessionId(sessionData.sessionId);
      setUserId(sessionData.userId);
    }

    // Fetch questions
    await fetchQuestions();

  } catch (error) {
    console.error('Error initializing assessment:', error);
    setError('Failed to initialize assessment');
    initializationRef.current = false; // Reset flag on error
  } finally {
    setLoading(false);
  }
}, [searchParams, language, router, fetchQuestions]);

  useEffect(() => {
    // Use ref to prevent double initialization in StrictMode
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    initializeAssessment();
  }, [initializeAssessment]);

  useEffect(() => {
    if (questions.length > 0 && questionParam !== currentQuestionIndex) {
      setCurrentQuestionIndex(questionParam);
    }
  }, [questions.length, questionParam, currentQuestionIndex]);

  useEffect(() => {
    if (questions.length > 0 && questions[currentQuestionIndex]?.options) {
      setShuffledOptions(questions[currentQuestionIndex].options);
    }
  }, [currentQuestionIndex, questions.length]);

  const handleAnswerSelect = useCallback((questionId, optionValue) => {
    setAllResponses(prev => {
      const newResponses = {
        ...prev,
        [questionId]: optionValue
      };

      // Save to sessionStorage as backup
      sessionStorage.setItem('assessmentResponses', JSON.stringify(newResponses));
      return newResponses;
    });
  }, []);

  const handleSubmitAssessment = useCallback(async () => {
    // Check if all questions are answered
    const answeredCount = Object.keys(allResponses).length;
    if (answeredCount < questions.length) {
      alert(getText('allQuestionsRequired'));
      return;
    }

    if (!sessionId || !assessmentCode) {
      setError('Session or code not found');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/complete-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: assessmentCode,
          sessionId: sessionId,
          responses: allResponses
        })
      });

      const result = await response.json();

      if (result.success) {
        // Clear session storage
        sessionStorage.removeItem('assessmentResponses');
        sessionStorage.removeItem('assessmentCode');

        // Redirect to results page (to be created)
        router.push(`/dma/results?lang=${language}&role=${role}&session=${sessionId}`);
      } else {
        setError(result.error || getText('submitError'));
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError(getText('submitError'));
    } finally {
      setSubmitting(false);
    }
  }, [allResponses, questions.length, sessionId, assessmentCode, getText, router, language, role]);

const handleNext = useCallback(async () => {
  // Auto-save current response before proceeding
  try {
    await fetch('/api/save-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        responses: allResponses,
        code: assessmentCode
      })
    });
  } catch (error) {
    console.error('Auto-save error:', error);
    // Continue anyway - don't block user progress
  }

  if (currentQuestionIndex < questions.length - 1) {
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    router.push(`/dma/questions?lang=${language}&role=${role}&question=${nextIndex}`);
  } else {
    // Last question - show submit
    handleSubmitAssessment();
  }
}, [sessionId, allResponses, assessmentCode, currentQuestionIndex, questions.length, router, language, role, handleSubmitAssessment]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      router.push(`/dma/questions?lang=${language}&role=${role}&question=${prevIndex}`);
    }
  }, [currentQuestionIndex, router, language, role]);

  const getProgressPercentage = useCallback(() => {
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  }, [currentQuestionIndex, questions.length]);

  const getAnsweredCount = useCallback(() => {
    return Object.keys(allResponses).length;
  }, [allResponses]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
              {getText('loading')}
              </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="page-container">
        <div className="container">
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '20px' }}>
              {getText('error')}
            </h2>
            <p style={{ marginBottom: '30px', color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
              {error || getText('error')}
            </p>
            <button onClick={() => {
              initializationRef.current = false;
              initializeAssessment();
            }} className="btn-primary">
              {getText('tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-container ${language === 'ar' ? 'rtl' : ''}`}>
      <div className="container">
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '40px' }}>
          
          {/* Language Indicator */}
          <div style={{ textAlign: language === 'ar' ? 'left' : 'right', marginBottom: '20px' }}>
            <span style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-primary)'
            }}>
              {getText('language')}: {language === 'ar' ? 'العربية' : 'English'}
            </span>
          </div>

                      {/* Welcome Back Message for Resume */}
            {isResuming && resumeUserData && (
              <div className="assessment-card" style={{ 
                marginBottom: '20px', 
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderLeft: language === 'ar' ? 'none' : '4px solid var(--success)',
                borderRight: language === 'ar' ? '4px solid var(--success)' : 'none'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  flexDirection: language === 'ar' ? 'row-reverse' : 'row'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>👋</span>
                  <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                    <p style={{ 
                      margin: '0', 
                      fontWeight: '600', 
                      color: 'var(--success)',
                      fontFamily: 'var(--font-primary)'
                    }}>
                      {getText('welcomeBack')}, {resumeUserData.name}!
                    </p>
                    <p style={{ 
                      margin: '5px 0 0 0', 
                      fontSize: '0.9rem', 
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-primary)'
                    }}>
                      {getText('continuingAssessment')}
                    </p>
                  </div>
                </div>
              </div>
            )}





          {/* Progress Section */}
          <div className="assessment-card" style={{ marginBottom: '30px' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row'
              }}>
                <span style={{ fontFamily: 'var(--font-primary)', fontWeight: '600' }}>
                  {getText('progress')}: {getProgressPercentage()}% {getText('complete')}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'var(--font-primary)' }}>
                  {getAnsweredCount()} {getText('of')} {questions.length} {getText('answered')}
                  </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            <div style={{ 
              textAlign: 'center',
              fontFamily: 'var(--font-primary)',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              {getText('question')} {currentQuestionIndex + 1} {getText('of')} {questions.length}
            </div>
          </div>

          {/* Question Content */}
          <div className="assessment-card" style={{ 
            minHeight: '500px', 
            display: 'flex', 
            flexDirection: 'column',
            marginBottom: '20px'
          }}>
            
            {/* Scenario */}
            {currentQuestion.scenario && (
              <div style={{ 
                marginBottom: '25px',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                <div style={{
                  color: 'var(--secondary-blue)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  flexDirection: language === 'ar' ? 'row-reverse' : 'row',
                  fontFamily: 'var(--font-primary)'
                }}>
                  📖 <strong>{getText('scenario')}:</strong>
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: 'var(--text-dark)',
                  fontStyle: 'italic',
                  padding: '12px',
                  backgroundColor: 'var(--light-gray)',
                  borderRadius: '8px',
                  lineHeight: '1.4',
                  textAlign: language === 'ar' ? 'right' : 'left',
                  fontFamily: 'var(--font-primary)',
                  direction: language === 'ar' ? 'rtl' : 'ltr'
                }}>
                  {currentQuestion.scenario}
                </div>
              </div>
            )}

            {/* Question */}
            <div style={{ 
              marginBottom: '20px',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              <h2 style={{ 
                marginBottom: '10px', 
                color: 'var(--primary-navy)', 
                fontSize: '1.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row',
                textAlign: language === 'ar' ? 'right' : 'left',
                fontFamily: 'var(--font-primary)'
              }}>
                <span style={{ fontSize: '1.8rem' }}>{currentQuestion.icon}</span>
                {currentQuestion.title}
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: 'var(--text-dark)', 
                margin: '0', 
                lineHeight: '1.5',
                textAlign: language === 'ar' ? 'right' : 'left',
                fontFamily: 'var(--font-primary)',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                {currentQuestion.question}
              </p>
            </div>

            {/* Options */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              minHeight: '0',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              {shuffledOptions.map((option, index) => (
                <label key={`${option.value}-${index}`} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid transparent',
                  backgroundColor: allResponses[currentQuestion.id] === option.value ? 'rgba(127, 122, 254, 0.15)' : 'white',
                  borderColor: allResponses[currentQuestion.id] === option.value ? 'var(--secondary-blue)' : 'var(--light-gray)',
                  transition: 'all 0.2s ease',
                  flexDirection: language === 'ar' ? 'row-reverse' : 'row',
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.value}
                    checked={allResponses[currentQuestion.id] === option.value}
                    onChange={() => handleAnswerSelect(currentQuestion.id, option.value)}
                    style={{ 
                      marginTop: '2px',
                      accentColor: 'var(--secondary-blue)',
                      order: language === 'ar' ? 2 : 1
                    }}
                  />
                  <span style={{ 
                    fontSize: '0.95rem', 
                    lineHeight: '1.4',
                    order: language === 'ar' ? 1 : 2,
                    flex: 1,
                    fontFamily: 'var(--font-primary)',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}>
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '40px',
            flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            gap: '10px'
          }}>
            
            {/* Previous Button */}
            {currentQuestionIndex > 0 ? (
              <button 
                onClick={handlePrevious}
                className="btn-secondary"
                style={{ fontSize: '1rem', padding: '12px 20px' }}
              >
                ← {getText('previous')}
              </button>
            ) : (
              <Link
                href={`/dma/role-selection?lang=${language}`}
                className="btn-secondary"
                style={{ 
                  fontSize: '1rem', 
                  padding: '12px 20px',
                  textDecoration: 'none'
                }}
              >
                ← {getText('backToRole')}
              </Link>
            )}

{/* Removed Save & Exit Button - Now empty space for better layout */}
<div style={{ flex: 1 }}></div>

            {/* Next/Finish Button */}
            <button 
              onClick={handleNext}
              disabled={!allResponses[currentQuestion.id] || submitting}
              className="btn-primary"
              style={{ 
                fontSize: '1rem', 
                padding: '12px 24px',
                opacity: (!allResponses[currentQuestion.id] || submitting) ? 0.5 : 1,
                cursor: (!allResponses[currentQuestion.id] || submitting) ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? getText('submitting') : 
               currentQuestionIndex === questions.length - 1 ? getText('finish') : getText('next')} →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssessmentPageContent />
    </Suspense>
  );
}