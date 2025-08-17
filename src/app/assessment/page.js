'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { roles } from '../../data/roles';

export default function AssessmentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleId = searchParams.get('role');
  const currentQuestionParam = searchParams.get('question') || '0';
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(parseInt(currentQuestionParam));
  const [allResponses, setAllResponses] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get current question safely - only after questions are loaded
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const overallProgress = currentQuestion ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  
  // Count answered questions
  const answeredCount = Object.keys(allResponses).length;

  // Shuffle function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/questions');
        const result = await response.json();
        
        if (result.success) {
          setQuestions(result.questions);
          setLoading(false);
        } else {
          setError('Failed to load questions');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        setError('Error loading questions');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    if (roleId && roles[roleId]) {
      setSelectedRole(roles[roleId]);
    }
  }, [roleId]);

  useEffect(() => {
    setCurrentQuestionIndex(parseInt(currentQuestionParam));
  }, [currentQuestionParam]);

  useEffect(() => {
    // Shuffle options when question changes
    if (currentQuestion && currentQuestion.options) {
      // Keep maturity levels (1-5) together, but shuffle them
      const maturityOptions = currentQuestion.options.filter(opt => typeof opt.value === 'number');
      const otherOptions = currentQuestion.options.filter(opt => typeof opt.value !== 'number');
      
      const shuffledMaturity = shuffleArray(maturityOptions);
      const finalOptions = [...shuffledMaturity, ...otherOptions]; // Keep NA/NS at end
      
      setShuffledOptions(finalOptions);
    }
  }, [currentQuestionIndex, currentQuestion]);

  const handleResponse = (questionId, value) => {
    setAllResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      // Go to next question
      const nextIndex = currentQuestionIndex + 1;
      router.push(`/assessment?role=${roleId}&question=${nextIndex}`);
    } else {
      // Assessment complete, go to results
      const queryParams = new URLSearchParams({
        role: roleId,
        responses: JSON.stringify(allResponses)
      });
      router.push(`/results?${queryParams.toString()}`);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      router.push(`/assessment?role=${roleId}&question=${prevIndex}`);
    }
  };

  const isCurrentQuestionAnswered = allResponses[currentQuestion?.id] !== undefined;

  // Loading state
  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <h2>Loading Assessment Questions...</h2>
            <p>Please wait while we prepare your assessment.</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-container">
        <div className="container">
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <h2>Error Loading Questions</h2>
            <p style={{ color: 'var(--danger)' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
              style={{ marginTop: '20px' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="page-container">
        <div className="container">
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <h2>Question not found</h2>
            <p>Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '15px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          
          {/* Overall Progress */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                Progress: {Math.round(overallProgress)}% Complete
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-secondary)', 
              textAlign: 'center',
              marginTop: '5px'
            }}>
              {answeredCount} of {totalQuestions} questions answered
            </div>
          </div>

          {/* Question Card - Flexible Height */}
          <div className="assessment-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '0' }}>
            
            {/* Question Header */}
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'var(--secondary-blue)', 
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: '15px'
            }}>
              {currentQuestion.subdomain?.replace('_', ' ') || 'Assessment'} • Question {currentQuestionIndex + 1}
            </div>

            {/* Scenario */}
            {currentQuestion.scenario && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--secondary-blue)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600'
                }}>
                  📖 <strong>Scenario:</strong>
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: 'var(--text-dark)',
                  fontStyle: 'italic',
                  padding: '12px',
                  backgroundColor: 'var(--light-gray)',
                  borderRadius: '8px',
                  lineHeight: '1.4'
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
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.8rem' }}>{currentQuestion.icon}</span>
                {currentQuestion.title}
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-dark)', margin: '0', lineHeight: '1.5' }}>
                {currentQuestion.question}
              </p>
            </div>

            {/* Options - Flexible height, no fixed margin */}
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
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.value}
                    checked={allResponses[currentQuestion.id] === option.value}
                    onChange={(e) => handleResponse(currentQuestion.id, option.value)}
                    style={{ marginTop: '3px' }}
                  />
                  <span style={{ flex: 1, fontSize: '1rem', lineHeight: '1.4' }}>
                    {option.value === 'na' && <strong>N/A) </strong>}
                    {option.value === 'ns' && <strong>NS) </strong>}
                    {option.text}
                  </span>
                </label>
              ))}
            </div>

            {/* Navigation - Fixed at bottom */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderTop: '1px solid var(--light-gray)',
              paddingTop: '15px',
              marginTop: '15px'
            }}>
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary"
                style={{ 
                  opacity: currentQuestionIndex === 0 ? 0.5 : 1,
                  cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← PREVIOUS
              </button>

              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-light)',
                textAlign: 'center'
              }}>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>

              <button
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered}
                className="btn-primary"
                style={{ 
                  opacity: !isCurrentQuestionAnswered ? 0.5 : 1,
                  cursor: !isCurrentQuestionAnswered ? 'not-allowed' : 'pointer'
                }}
              >
                {currentQuestionIndex === totalQuestions - 1 ? 'FINISH ASSESSMENT →' : 'NEXT QUESTION →'}
              </button>
            </div>

          </div>

          {/* Role Context */}
          {selectedRole && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px',
              fontSize: '0.9rem',
              color: 'var(--text-light)'
            }}>
              Assessment for: <strong>{selectedRole.title}</strong>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}