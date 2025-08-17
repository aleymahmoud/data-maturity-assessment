'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CodeEntryPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const result = await response.json();

      if (result.success) {
        // Store code data for next steps
        sessionStorage.setItem('assessmentCode', code.trim().toUpperCase());
        sessionStorage.setItem('organizationName', result.data.organizationName || '');
        sessionStorage.setItem('intendedRecipient', result.data.intendedRecipient || '');
        
        // Navigate to user info page
        router.push('/user-info');
      } else {
        setError(result.error || 'Invalid assessment code');
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="container">
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '80px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ marginBottom: '10px' }}>Enter Assessment Code</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              Please enter the assessment code provided to you to begin the evaluation.
            </p>
          </div>

          {/* Code Entry Form */}
          <div className="assessment-card">
            <form onSubmit={handleSubmit}>
              
              {/* Code Input */}
              <div style={{ marginBottom: '25px' }}>
                <label 
                  htmlFor="assessment-code" 
                  style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}
                >
                  Assessment Code *
                </label>
                <input
                  id="assessment-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter your assessment code (e.g., DEMO1234)"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1.1rem',
                    border: '2px solid var(--light-gray)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                  }}
                  disabled={loading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  border: '2px solid var(--danger)',
                  borderRadius: '8px',
                  color: 'var(--danger)',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !code.trim()}
                style={{
                  width: '100%',
                  fontSize: '1.1rem',
                  padding: '14px',
                  opacity: (loading || !code.trim()) ? 0.5 : 1,
                  cursor: (loading || !code.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Validating Code...' : 'Validate & Continue'}
              </button>

            </form>
          </div>

          {/* Demo Codes Info */}
          <div className="assessment-card" style={{ 
            backgroundColor: 'rgba(127, 122, 254, 0.05)',
            border: '2px solid var(--secondary-blue)'
          }}>
            <h3 style={{ color: 'var(--secondary-blue)', marginBottom: '15px' }}>
              📝 Demo Codes Available
            </h3>
            <p style={{ marginBottom: '10px' }}>For testing purposes, you can use these demo codes:</p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              <div><strong>DEMO1234</strong> - Demo Organization</div>
              <div><strong>TEST5678</strong> - Test Company</div>
              <div><strong>EVAL9999</strong> - Evaluation Corp</div>
            </div>
          </div>

          {/* Back Link */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              ← Back to Welcome
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}