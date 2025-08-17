'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('lang') || 'en';

  // Language-specific content
  const getContent = () => {
    const content = {
      en: {
        language: 'Language',
        title: 'Your Information',
        description: 'Please provide your details to personalize the assessment experience.',
        nameLabel: 'Full Name *',
        namePlaceholder: 'Enter your full name',
        emailLabel: 'Email Address *',
        emailPlaceholder: 'Enter your email address',
        organizationLabel: 'Organization *',
        organizationPlaceholder: 'Enter your organization name',
        roleTitleLabel: 'Job Title/Role *',
        roleTitlePlaceholder: 'Enter your job title or role',
        continueButton: 'Continue to Role Selection',
        processingButton: 'Processing...',
        backLink: 'Back to Code Entry'
      },
      ar: {
        language: 'اللغة',
        title: 'معلوماتك',
        description: 'يرجى تقديم تفاصيلك لتخصيص تجربة التقييم.',
        nameLabel: 'الاسم الكامل *',
        namePlaceholder: 'أدخل اسمك الكامل',
        emailLabel: 'عنوان البريد الإلكتروني *',
        emailPlaceholder: 'أدخل عنوان بريدك الإلكتروني',
        organizationLabel: 'المؤسسة *',
        organizationPlaceholder: 'أدخل اسم مؤسستك',
        roleTitleLabel: 'المسمى الوظيفي/الدور *',
        roleTitlePlaceholder: 'أدخل مسماك الوظيفي أو دورك',
        continueButton: 'متابعة لاختيار الدور',
        processingButton: 'جاري المعالجة...',
        backLink: 'العودة لإدخال الرمز'
      }
    };
    return content[language];
  };

  const content = getContent();

  useEffect(() => {
    // Check if user came from code entry
    const code = sessionStorage.getItem('assessmentCode');
    const orgName = sessionStorage.getItem('organizationName');
    
    if (!code) {
      router.push(`/code-entry?lang=${language}`);
      return;
    }

    // Pre-fill organization if available
    if (orgName) {
      setFormData(prev => ({
        ...prev,
        organization: orgName
      }));
    }
  }, [router, language]);

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
      // Store user data in session storage
      sessionStorage.setItem('userData', JSON.stringify(formData));
      
      // Navigate to role selection with language
      router.push(`/role-selection?lang=${language}`);
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
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
          paddingTop: '60px',
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
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              
              {/* Name */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="name" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontFamily: 'var(--font-primary)', 
                  fontWeight: '600',
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  {content.nameLabel}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={content.namePlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    border: '2px solid var(--light-gray)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-primary)',
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}
                  required
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="email" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontFamily: 'var(--font-primary)', 
                  fontWeight: '600',
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  {content.emailLabel}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={content.emailPlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    border: '2px solid var(--light-gray)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-primary)',
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}
                  required
                />
              </div>

              {/* Organization */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="organization" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontFamily: 'var(--font-primary)', 
                  fontWeight: '600',
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  {content.organizationLabel}
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder={content.organizationPlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    border: '2px solid var(--light-gray)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-primary)',
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}
                  required
                />
              </div>

              {/* Role Title */}
              <div style={{ marginBottom: '30px' }}>
                <label htmlFor="roleTitle" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontFamily: 'var(--font-primary)', 
                  fontWeight: '600',
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}>
                  {content.roleTitleLabel}
                </label>
                <input
                  type="text"
                  id="roleTitle"
                  name="roleTitle"
                  value={formData.roleTitle}
                  onChange={handleInputChange}
                  placeholder={content.roleTitlePlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    border: '2px solid var(--light-gray)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-primary)',
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}
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
                  textAlign: 'center',
                  fontFamily: 'var(--font-primary)'
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.name || !formData.email || !formData.organization || !formData.roleTitle}
                className="btn-primary"
                style={{
                  width: '100%',
                  fontSize: '1.1rem',
                  padding: '14px 28px',
                  opacity: (loading || !formData.name || !formData.email || !formData.organization || !formData.roleTitle) ? 0.5 : 1,
                  cursor: (loading || !formData.name || !formData.email || !formData.organization || !formData.roleTitle) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-primary)'
                }}
              >
                {loading ? content.processingButton : content.continueButton}
              </button>

            </form>
          </div>

          {/* Back Link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href={`/code-entry?lang=${language}`} style={{ 
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