'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

  // Language-specific text
  const getText = useCallback((key) => {
    const texts = {
      en: {
        loading: 'Loading questions...',
        error: 'Error Loading Questions',
        tryAgain: 'Try Again',
        previous: 'Back',
        next: 'Next',
        finish: 'Submit Assessment',
        submitting: 'Submitting...',
        submitError: 'Failed to submit assessment. Please try again.',
        na: 'N/A',
        notSure: 'Not Sure',
        welcomeBack: 'Welcome back',
        continuingAssessment: 'Continuing your assessment from where you left off.'
      },
      ar: {
        loading: 'جاري تحميل الأسئلة...',
        error: 'خطأ في تحميل الأسئلة',
        tryAgain: 'حاول مرة أخرى',
        previous: 'السابق',
        next: 'التالي',
        finish: 'إنهاء التقييم',
        submitting: 'جاري الإرسال...',
        submitError: 'فشل إرسال التقييم. يرجى المحاولة مرة أخرى.',
        na: 'غير قابل للتطبيق',
        notSure: 'غير متأكد',
        welcomeBack: 'مرحبًا بعودتك',
        continuingAssessment: 'مواصلة التقييم من حيث توقفت.'
      }
    };
    return texts[language][key] || texts['en'][key];
  }, [language]);

  const currentQuestion = questions[currentQuestionIndex] || {};

  // Fetch questions from API
  const fetchQuestions = useCallback(async (code) => {
    try {
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

      const isResumingFromCode = searchParams.get('resume') === 'true';
      const sessionIdFromUrl = searchParams.get('session');

      let sessionCode = '';
      let userData = null;
      let selectedRole = null;

      if (isResumingFromCode && sessionIdFromUrl) {
        const resumeData = JSON.parse(sessionStorage.getItem('resumeData') || 'null');
        if (resumeData) {
          sessionCode = resumeData.code;
          userData = resumeData.userData;
          selectedRole = resumeData.userData.selectedRole;
          setSessionId(sessionIdFromUrl);
          setResumeUserData(userData);
          setIsResuming(true);
        }
      } else {
        const storedUserData = JSON.parse(sessionStorage.getItem('userData') || 'null');
        if (storedUserData) {
          userData = storedUserData;
          selectedRole = storedUserData.selectedRole;
          sessionCode = sessionStorage.getItem('assessmentCode') || '';
          const storedSessionId = sessionStorage.getItem('sessionId');
          if (storedSessionId) setSessionId(storedSessionId);
        }
      }

      if (!sessionCode) {
        router.push(`/dma/start?lang=${language}`);
        return;
      }

      setAssessmentCode(sessionCode);
      await fetchQuestions(sessionCode);

      if (sessionIdFromUrl) {
        const savedResponsesStr = sessionStorage.getItem('assessmentResponses');
        if (savedResponsesStr) {
          setAllResponses(JSON.parse(savedResponsesStr));
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing assessment:', error);
      setError('Failed to initialize assessment');
      setLoading(false);
    }
  }, [searchParams, language, router, fetchQuestions]);

  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = true;
      initializeAssessment();
    }
  }, [initializeAssessment]);

  useEffect(() => {
    if (questions.length > 0) {
      setShuffledOptions(questions[currentQuestionIndex].options);
    }
  }, [currentQuestionIndex, questions.length]);

  const handleAnswerSelect = useCallback((questionId, optionValue) => {
    setAllResponses(prev => {
      const newResponses = {
        ...prev,
        [questionId]: optionValue
      };
      sessionStorage.setItem('assessmentResponses', JSON.stringify(newResponses));
      return newResponses;
    });
  }, []);

  const handleSubmitAssessment = useCallback(async () => {
    if (Object.keys(allResponses).length < questions.length) {
      setError(getText('submitError'));
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

      const data = await response.json();

      if (data.success) {
        sessionStorage.removeItem('assessmentResponses');
        router.push(`/dma/results?session=${sessionId}&lang=${language}`);
      } else {
        setError(data.error || getText('submitError'));
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError(getText('submitError'));
      setSubmitting(false);
    }
  }, [allResponses, questions.length, sessionId, assessmentCode, getText, router, language]);

  const handleNext = useCallback(async () => {
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
    }

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      router.push(`/dma/questions?lang=${language}&role=${role}&question=${nextIndex}`);
    } else {
      handleSubmitAssessment();
    }
  }, [currentQuestionIndex, questions.length, language, role, router, handleSubmitAssessment, allResponses, sessionId, assessmentCode]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      router.push(`/dma/questions?lang=${language}&role=${role}&question=${prevIndex}`);
    }
  }, [currentQuestionIndex, language, role, router]);

  const getProgressPercentage = () => {
    const answered = Object.keys(allResponses).length;
    return Math.round((answered / questions.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E1B4B] mx-auto mb-4"></div>
          <p className="text-[#1E1B4B]">{getText('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-red-600 text-xl font-semibold mb-4">{getText('error')}</h2>
          <p className="text-[#4C1D95] mb-6">{error || getText('error')}</p>
          <button
            onClick={() => {
              initializationRef.current = false;
              initializeAssessment();
            }}
            className="px-6 py-2 bg-[#1E1B4B] text-white rounded-lg hover:bg-[#2D2960] transition-colors"
          >
            {getText('tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const answeredCount = Object.keys(allResponses).length;
  const isAnswered = allResponses[currentQuestion.id] !== undefined;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] p-4 flex items-center justify-center ${language === 'ar' ? 'rtl' : ''}`}>
      <div className="w-full max-w-2xl">
        {/* Welcome Back Message */}
        {isResuming && resumeUserData && (
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">👋</span>
            <div>
              <p className="font-semibold text-[#4C1D95]">
                {getText('welcomeBack')}, {resumeUserData.name}!
              </p>
              <p className="text-sm text-[#8B5CF6]">
                {getText('continuingAssessment')}
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar - Compact 2 lines */}
        <div className="bg-white rounded-lg border border-violet-200 p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-[#1E1B4B]">
              {answeredCount} / {questions.length} answered
            </span>
            <span className="font-semibold text-[#1E1B4B]">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-violet-100 rounded-full h-2">
            <div
              className="bg-[#1E1B4B] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl border border-violet-200 p-6 shadow-lg">
          {/* Header with Subdomain and Question Number */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#1E1B4B] text-xs font-medium tracking-wide uppercase">
              {currentQuestion.subdomain || 'Assessment'}
            </span>
            <span className="text-[#1E1B4B] opacity-60 text-xs">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>

          {/* Question Title and Icon */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{currentQuestion.icon || '📋'}</span>
              <h3 className="text-base font-semibold text-[#1E1B4B]">
                {currentQuestion.title}
              </h3>
            </div>
            <h2 className="text-lg font-medium text-[#4C1D95] leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Scenario if exists */}
          {currentQuestion.scenario && (
            <div className="mb-5 p-3 bg-violet-50 border-l-4 border-[#1E1B4B] rounded">
              <p className="text-sm text-[#1E1B4B] italic">
                <strong className="text-[#1E1B4B]">Scenario:</strong> {currentQuestion.scenario}
              </p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-2">
            {shuffledOptions.map((option, index) => {
              const isSelected = allResponses[currentQuestion.id] === option.value;
              const isSpecial = option.value === 'na' || option.value === 'ns';

              return (
                <button
                  key={`${option.value}-${index}`}
                  onClick={() => handleAnswerSelect(currentQuestion.id, option.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                    isSelected
                      ? 'bg-violet-50 border border-[#1E1B4B] text-[#1E1B4B]'
                      : 'bg-slate-50 border border-transparent text-slate-600 hover:bg-violet-50/50 hover:text-[#1E1B4B]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#1E1B4B] bg-[#1E1B4B]'
                      : 'border-slate-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Footer with NA/NS and Navigation */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-violet-100">
            <div className="flex gap-2">
              <button
                onClick={() => handleAnswerSelect(currentQuestion.id, 'na')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  allResponses[currentQuestion.id] === 'na'
                    ? 'bg-violet-100 text-[#1E1B4B]'
                    : 'text-slate-400 hover:text-[#1E1B4B]'
                }`}
              >
                {getText('na')}
              </button>
              <button
                onClick={() => handleAnswerSelect(currentQuestion.id, 'ns')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  allResponses[currentQuestion.id] === 'ns'
                    ? 'bg-violet-100 text-[#1E1B4B]'
                    : 'text-slate-400 hover:text-[#1E1B4B]'
                }`}
              >
                {getText('notSure')}
              </button>
            </div>

            <div className="flex gap-2">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-[#1E1B4B] transition-colors"
                >
                  {getText('previous')}
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!isAnswered || submitting}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isAnswered && !submitting
                    ? 'bg-[#1E1B4B] text-white hover:bg-[#2D2960]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting
                  ? getText('submitting')
                  : currentQuestionIndex === questions.length - 1
                    ? getText('finish')
                    : getText('next')
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <AssessmentPageContent />
    </Suspense>
  );
}
