'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserInfoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    roleTitle: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeData, setCodeData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user came from code entry
    const assessmentCode = sessionStorage.getItem('assessmentCode');
    const organizationName = sessionStorage.getItem('organizationName');
    const intendedRecipient = sessionStorage.getItem('intendedRecipient');

    if (!assessmentCode) {
      // Redirect to code entry if no valid code
      router.push('/code-entry');
      return;
    }

    setCodeData({
      code: assessmentCode,
      organizationName,
      intendedRecipient
    });

    // Pre-fill organization name if available
    if (organizationName) {
      setFormData(prev => ({
        ...prev,
        organization: organizationName
      }));
    }

    // Pre-fill recipient name if available
    if (intendedRecipient) {
      setFormData(prev => ({
        ...prev,
        name: intendedRecipient
      }));
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Store user info for role selection
      sessionStorage.setItem('userInfo', JSON.stringify(formData));
      
      // Navigate to role selection
      router.push('/role-selection');
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!codeData) {
    return (
      <div className="page-container">
        <div className="container">
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <h2>Redirecting...</h2>
            <p>Please wait while we verify your assessment code.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        <div style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '40px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1>Your Information</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '20px 0' }}>
              Please provide your details to personalize your assessment experience.
            </p>
          </div>

          {/* Code Confirmation */}
          <div className="assessment-card" style={{ 
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            border: '2px solid var(--success)',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <div>
                <strong>Assessment Code Verified: {codeData.code}</strong>
                {codeData.organizationName && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    Organization: {codeData.organizationName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Info Form */}
          <div className="assessment-card">
            <form onSubmit={handleSubmit}>
              
              {/* Name Field */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="name"
                  style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}
                >
                  Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    border: `2px solid ${!formData.name ? 'var(--danger)' : 'var(--light-gray)'}`,
                    borderRadius: '8px',
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>

              {/* Email Field */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="email"
                  style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}
                >
                  Email Address <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    border: `2px solid ${!formData.email || !/\S+@\S+\.\S+/.test(formData.email) ? 'var(--danger)' : 'var(--light-gray)'}`,
                    borderRadius: '8px',
                    fontFamily: 'var(--font-body)'
                  }}
                />
                {formData.email && !/\S+@\S+\.\S+/.test(formData.email) && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                    Please enter a valid email address
                  </div>
                )}
              </div>

              {/* Organization Field */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="organization"
                  style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}
                >
                  Organization *
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder="Enter your organization name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    border: '2px solid var(--light-gray)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>

              {/* Role Title Field */}
              <div style={{ marginBottom: '25px' }}>
                <label 
                  htmlFor="roleTitle"
                  style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}
                >
                  Your Role/Title *
                </label>
                <input
                  id="roleTitle"
                  name="roleTitle"
                  type="text"
                  value={formData.roleTitle}
                  onChange={handleInputChange}
                  placeholder="Enter your role or job title"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    border: '2px solid var(--light-gray)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-body)'
                  }}
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
                disabled={loading || !formData.name || !formData.email || !formData.organization || !formData.roleTitle}
                style={{
                  width: '100%',
                  fontSize: '1.1rem',
                  padding: '14px',
                  opacity: (loading || !formData.name || !formData.email || !formData.organization || !formData.roleTitle) ? 0.5 : 1,
                  cursor: (loading || !formData.name || !formData.email || !formData.organization || !formData.roleTitle) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Continue to Role Selection'}
              </button>

            </form>
          </div>

          {/* Back Link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href="/code-entry" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              ← Back to Code Entry
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}