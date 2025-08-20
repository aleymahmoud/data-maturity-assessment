'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CodeEntryPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('lang') || 'en';

  // Language-specific content
  const getContent = () => {
    const content = {
      en: {
        language: 'Language',
        title: 'Enter Assessment Code',
        description: 'Please enter the assessment code provided to you to begin the evaluation.',
        codeLabel: 'Assessment Code',
        codePlaceholder: 'Enter your code (e.g., DEMO1234)',
        continueButton: 'Continue',
        validatingButton: 'Validating...',
        backLink: 'Back to Welcome',
        resumingAssessment: 'Resuming your assessment...',
        redirectingToResults: 'Redirecting to your results...',
      },
      ar: {
        language: 'اللغة',
        title: 'أدخل رمز التقييم',
        description: 'يرجى إدخال رمز التقييم المقدم لك لبدء التقييم.',
        codeLabel: 'رمز التقييم',
        codePlaceholder: 'أدخل الرمز الخاص بك (مثال: DEMO1234)',
        continueButton: 'متابعة',
        validatingButton: 'جاري التحقق...',
        backLink: 'العودة للترحيب',
        resumingAssessment: 'جاري استئناف تقييمك...',
        redirectingToResults: 'جاري التوجيه إلى نتائجك...',
      }
    };
    return content[language];
  };

  const content = getContent();

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await fetch('/api/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: assessmentCode })
    });

    const result = await response.json();

    if (result.valid) {
      // Store the assessment code
      sessionStorage.setItem('assessmentCode', assessmentCode);

      if (result.isCompleted) {
        // Assessment is completed - redirect to results
        sessionStorage.setItem('completedSessionId', result.sessionId);
        sessionStorage.setItem('completedUserData', JSON.stringify(result.userData));
        router.push(`/results?lang=${language}&session=${result.sessionId}`);
        
      } else if (result.hasUserData) {
        // User data exists - resume assessment directly
        const resumeData = result.resumeData;
        
        // Store resume data in session storage
        sessionStorage.setItem('resumeData', JSON.stringify(resumeData));
        sessionStorage.setItem('isResuming', 'true');
        
        // Redirect directly to assessment with resume parameters
        router.push(`/assessment?lang=${resumeData.language}&resume=true&session=${resumeData.sessionId}`);
        
      } else {
        // First time use - continue to user info
        if (result.organizationName) {
          sessionStorage.setItem('organizationName', result.organizationName);
        }
        router.push(`/user-info?lang=${language}`);
      }
    } else {
      setError(result.error || content.invalidCode);
    }
  } catch (error) {
    console.error('Validation error:', error);
    setError(content.networkError);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className={`page-container ${language === 'ar' ? 'rtl' : ''}`}>
      <div className="container">
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          paddingTop: '80px',
          fontFamily: 'var(--font-primary)'
        }}>
          
          {/* Language Indicator */}
          <div style={{ 
            textAlign: language === 'ar' ? 'left' : 'right', 
            marginBottom: '20px' 
          }}>
            <span style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.language}: {language === 'ar' ? 'العربية' : 'English'}
            </span>
          </div>

          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px',
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}>
            <h1 style={{ 
              marginBottom: '10px',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.title}
            </h1>
            <p style={{ 
              fontSize: '1.1rem', 
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.description}
            </p>
          </div>

          {/* Form */}
          <div className="assessment-card">
            <form onSubmit={handleSubmit} style={{ 
              textAlign: 'center',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              
              {/* Code Input */}
              <div style={{ marginBottom: '25px' }}>
                <label htmlFor="code" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontFamily: 'var(--font-primary)', 
                  fontWeight: '600',
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  {content.codeLabel}
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={content.codePlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1.1rem',
                    border: '2px solid var(--light-gray)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-primary)',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    direction: 'ltr' // Keep code input LTR always
                  }}
                  maxLength={10}
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={{ 
                  color: 'var(--danger)', 
                  marginBottom: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  fontFamily: 'var(--font-primary)',
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !code}
                className="btn-primary"
                style={{
                  fontSize: '1.1rem',
                  padding: '14px 28px',
                  opacity: (loading || !code) ? 0.5 : 1,
                  cursor: (loading || !code) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-primary)'
                }}
              >
                {loading ? content.validatingButton : content.continueButton}
              </button>

            </form>
          </div>

          {/* Back Link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href={`/?lang=${language}`} style={{ 
              color: 'var(--text-secondary)', 
              textDecoration: 'none',
              fontFamily: 'var(--font-primary)'
            }}>
              ← {content.backLink}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}