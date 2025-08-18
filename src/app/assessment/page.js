'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AssessmentPage() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allResponses, setAllResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shuffledOptions, setShuffledOptions] = useState([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('lang') || 'en';
  const role = searchParams.get('role') || '';
  const questionParam = parseInt(searchParams.get('question') || '0');

  useEffect(() => {
    // Validate user came through proper flow
    const userData = sessionStorage.getItem('userData');
    const selectedRole = sessionStorage.getItem('selectedRole');
    
    if (!userData || !selectedRole) {
      router.push(`/role-selection?lang=${language}`);
      return;
    }

    fetchQuestions();
  }, [language, router]);

  useEffect(() => {
    if (questions.length > 0) {
      setCurrentQuestionIndex(questionParam);
      
      // Load existing responses from sessionStorage
      const savedResponses = sessionStorage.getItem('assessmentResponses');
      if (savedResponses) {
        setAllResponses(JSON.parse(savedResponses));
      }
    }
  }, [questions, questionParam]);

  useEffect(() => {
    if (questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion?.options) {
        setShuffledOptions(currentQuestion.options);
      }
    }
  }, [currentQuestionIndex, questions]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions?lang=${language}`);
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
      } else {
        setError('Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionValue) => {
    const newResponses = {
      ...allResponses,
      [questionId]: optionValue
    };
    
    setAllResponses(newResponses);
    
    // Save to sessionStorage
    sessionStorage.setItem('assessmentResponses', JSON.stringify(newResponses));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      router.push(`/assessment?lang=${language}&role=${role}&question=${nextIndex}`);
    } else {
      // Assessment complete - go to results
      router.push(`/results?lang=${language}&role=${role}`);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      router.push(`/assessment?lang=${language}&role=${role}&question=${prevIndex}`);
    }
  };

  const getProgressPercentage = () => {
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  };

  const getAnsweredCount = () => {
    return Object.keys(allResponses).length;
  };

  // Language-specific text
  const getText = (key) => {
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
        backToRole: 'Back to Role Selection',
        language: 'Language'
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
        backToRole: 'العودة لاختيار الدور',
        language: 'اللغة'
      }
    };
    return texts[language][key] || texts.en[key];
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
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
            <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>
              {error || getText('error')}
            </p>
            <button onClick={fetchQuestions} className="btn-primary">
              {getText('tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

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
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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
                direction: language === 'ar' ? 'rtl' : 'ltr'  // ← ADD THIS LINE
              }}>
                <div style={{
                  color: 'var(--secondary-blue)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  flexDirection: language === 'ar' ? 'row-reverse' : 'row'
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
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  {currentQuestion.scenario}
                </div>
              </div>
            )}

            {/* Question */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ 
                marginBottom: '10px', 
                color: 'var(--primary-navy)', 
                fontSize: '1.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row',
                textAlign: language === 'ar' ? 'right' : 'left'
              }}>
                <span style={{ fontSize: '1.8rem' }}>{currentQuestion.icon}</span>
                {currentQuestion.title}
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: 'var(--text-dark)', 
                margin: '0', 
                lineHeight: '1.5',
                textAlign: language === 'ar' ? 'right' : 'left'
              }}>
                {currentQuestion.question}
              </p>
            </div>

            {/* Options */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '0' }}>
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
                    flex: 1
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
            flexDirection: language === 'ar' ? 'row-reverse' : 'row'
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
                href={`/role-selection?lang=${language}`} 
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

            {/* Next/Finish Button */}
            <button 
              onClick={handleNext}
              disabled={!allResponses[currentQuestion.id]}
              className="btn-primary"
              style={{ 
                fontSize: '1rem', 
                padding: '12px 24px',
                opacity: !allResponses[currentQuestion.id] ? 0.5 : 1,
                cursor: !allResponses[currentQuestion.id] ? 'not-allowed' : 'pointer'
              }}
            >
              {currentQuestionIndex === questions.length - 1 ? getText('finish') : getText('next')} →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}