'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UserInfoPageContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    organizationSize: '',
    industry: '',
    country: '',
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
        organizationSizeLabel: 'Organization Size *',
        organizationSizePlaceholder: 'Select organization size',
        industryLabel: 'Industry/Sector *',
        industryPlaceholder: 'Select your industry',
        countryLabel: 'Country/Region',
        countryPlaceholder: 'Select your country',
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
        organizationSizeLabel: 'حجم المؤسسة *',
        organizationSizePlaceholder: 'اختر حجم المؤسسة',
        industryLabel: 'الصناعة/القطاع *',
        industryPlaceholder: 'اختر الصناعة',
        countryLabel: 'البلد/المنطقة',
        countryPlaceholder: 'اختر البلد',
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

  // Organization size options
  const organizationSizes = {
    en: [
      { value: '1-10', label: '1-10 employees (Micro)' },
      { value: '11-50', label: '11-50 employees (Small)' },
      { value: '51-200', label: '51-200 employees (Medium)' },
      { value: '201-500', label: '201-500 employees (Medium-Large)' },
      { value: '501-1000', label: '501-1,000 employees (Large)' },
      { value: '1001-5000', label: '1,001-5,000 employees (Large)' },
      { value: '5001+', label: '5,001+ employees (Enterprise)' }
    ],
    ar: [
      { value: '1-10', label: '1-10 موظف (صغيرة جداً)' },
      { value: '11-50', label: '11-50 موظف (صغيرة)' },
      { value: '51-200', label: '51-200 موظف (متوسطة)' },
      { value: '201-500', label: '201-500 موظف (متوسطة-كبيرة)' },
      { value: '501-1000', label: '501-1,000 موظف (كبيرة)' },
      { value: '1001-5000', label: '1,001-5,000 موظف (كبيرة)' },
      { value: '5001+', label: '5,001+ موظف (مؤسسة كبرى)' }
    ]
  };

  // Industry options
  const industries = {
    en: [
      { value: 'government', label: 'Government & Public Sector' },
      { value: 'healthcare', label: 'Healthcare & Medical Services' },
      { value: 'education', label: 'Education & Research' },
      { value: 'finance', label: 'Finance & Banking' },
      { value: 'technology', label: 'Technology & Software' },
      { value: 'manufacturing', label: 'Manufacturing & Industrial' },
      { value: 'retail', label: 'Retail & E-commerce' },
      { value: 'telecommunications', label: 'Telecommunications' },
      { value: 'energy', label: 'Energy & Utilities' },
      { value: 'transportation', label: 'Transportation & Logistics' },
      { value: 'consulting', label: 'Consulting & Professional Services' },
      { value: 'nonprofit', label: 'Non-Profit & NGO' },
      { value: 'other', label: 'Other' }
    ],
    ar: [
      { value: 'government', label: 'الحكومة والقطاع العام' },
      { value: 'healthcare', label: 'الرعاية الصحية والخدمات الطبية' },
      { value: 'education', label: 'التعليم والبحث العلمي' },
      { value: 'finance', label: 'المالية والخدمات المصرفية' },
      { value: 'technology', label: 'التكنولوجيا والبرمجيات' },
      { value: 'manufacturing', label: 'التصنيع والصناعة' },
      { value: 'retail', label: 'التجزئة والتجارة الإلكترونية' },
      { value: 'telecommunications', label: 'الاتصالات' },
      { value: 'energy', label: 'الطاقة والمرافق' },
      { value: 'transportation', label: 'النقل والخدمات اللوجستية' },
      { value: 'consulting', label: 'الاستشارات والخدمات المهنية' },
      { value: 'nonprofit', label: 'المنظمات غير الربحية' },
      { value: 'other', label: 'أخرى' }
    ]
  };

  // Country options (Middle East & North Africa + major countries)
  const countries = {
    en: [
      { value: 'SA', label: 'Saudi Arabia' },
      { value: 'AE', label: 'United Arab Emirates' },
      { value: 'EG', label: 'Egypt' },
      { value: 'JO', label: 'Jordan' },
      { value: 'KW', label: 'Kuwait' },
      { value: 'QA', label: 'Qatar' },
      { value: 'BH', label: 'Bahrain' },
      { value: 'OM', label: 'Oman' },
      { value: 'LB', label: 'Lebanon' },
      { value: 'IQ', label: 'Iraq' },
      { value: 'MA', label: 'Morocco' },
      { value: 'TN', label: 'Tunisia' },
      { value: 'US', label: 'United States' },
      { value: 'GB', label: 'United Kingdom' },
      { value: 'other', label: 'Other' }
    ],
    ar: [
      { value: 'SA', label: 'المملكة العربية السعودية' },
      { value: 'AE', label: 'الإمارات العربية المتحدة' },
      { value: 'EG', label: 'مصر' },
      { value: 'JO', label: 'الأردن' },
      { value: 'KW', label: 'الكويت' },
      { value: 'QA', label: 'قطر' },
      { value: 'BH', label: 'البحرين' },
      { value: 'OM', label: 'عمان' },
      { value: 'LB', label: 'لبنان' },
      { value: 'IQ', label: 'العراق' },
      { value: 'MA', label: 'المغرب' },
      { value: 'TN', label: 'تونس' },
      { value: 'US', label: 'الولايات المتحدة' },
      { value: 'GB', label: 'المملكة المتحدة' },
      { value: 'other', label: 'أخرى' }
    ]
  };

useEffect(() => {
  // Check if user came from code entry
  const code = sessionStorage.getItem('assessmentCode');
  const orgName = sessionStorage.getItem('organizationName');

  if (!code) {
    router.push(`/dma/start?lang=${language}`);
    return;
  }

  // Check for existing user data in database first
  const checkExistingUserData = async () => {
    try {
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (result.valid && result.hasUserData && result.existingUser) {
        // Load existing user data from database
        setFormData({
          name: result.existingUser.name || '',
          email: result.existingUser.email || '',
          organization: result.existingUser.organization || '',
          organizationSize: result.existingUser.organizationSize || '',
          industry: result.existingUser.industry || '',
          country: result.existingUser.country || '',
          roleTitle: result.existingUser.roleTitle || ''
        });
        return;
      }
    } catch (error) {
      console.error('Error checking existing user data:', error);
    }

    // Fallback: Check sessionStorage for resume data
    const resumeData = sessionStorage.getItem('resumeData');
    if (resumeData && resumeData !== 'undefined' && resumeData !== 'null') {
      try {
        const data = JSON.parse(resumeData);
        if (data && data.userData) {
          setFormData({
            name: data.userData.name || '',
            email: data.userData.email || '',
            organization: data.userData.organization || '',
            organizationSize: data.userData.organizationSize || '',
            industry: data.userData.industry || '',
            country: data.userData.country || '',
            roleTitle: data.userData.roleTitle || ''
          });
          return;
        }
      } catch (error) {
        console.error('Error parsing resume data:', error);
        sessionStorage.removeItem('resumeData');
      }
    }

    // Final fallback: Use organization name if available
    if (orgName) {
      setFormData(prev => ({
        ...prev,
        organization: orgName
      }));
    }
  };

  checkExistingUserData();
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
      router.push(`/dma/role-selection?lang=${language}`);
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

              {/* Row 1: Name and Email */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                {/* Name */}
                <div>
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
                <div>
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

              {/* Row 2: Organization Size and Industry */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                {/* Organization Size */}
                <div>
                  <label htmlFor="organizationSize" style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: '600',
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}>
                    {content.organizationSizeLabel}
                  </label>
                  <select
                    id="organizationSize"
                    name="organizationSize"
                    value={formData.organizationSize}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      border: '2px solid var(--light-gray)',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-primary)',
                      textAlign: language === 'ar' ? 'right' : 'left',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                    required
                  >
                    <option value="">{content.organizationSizePlaceholder}</option>
                    {organizationSizes[language].map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label htmlFor="industry" style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: '600',
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}>
                    {content.industryLabel}
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      border: '2px solid var(--light-gray)',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-primary)',
                      textAlign: language === 'ar' ? 'right' : 'left',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                    required
                  >
                    <option value="">{content.industryPlaceholder}</option>
                    {industries[language].map(ind => (
                      <option key={ind.value} value={ind.value}>{ind.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Country and Role Title */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {/* Country (Optional) */}
                <div>
                  <label htmlFor="country" style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: '600',
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}>
                    {content.countryLabel}
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      border: '2px solid var(--light-gray)',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-primary)',
                      textAlign: language === 'ar' ? 'right' : 'left',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">{content.countryPlaceholder}</option>
                    {countries[language].map(country => (
                      <option key={country.value} value={country.value}>{country.label}</option>
                    ))}
                  </select>
                </div>

                {/* Role Title */}
                <div>
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
                disabled={loading || !formData.name || !formData.email || !formData.organization || !formData.organizationSize || !formData.industry || !formData.roleTitle}
                className="btn-primary"
                style={{
                  width: '100%',
                  fontSize: '1.1rem',
                  padding: '14px 28px',
                  opacity: (loading || !formData.name || !formData.email || !formData.organization || !formData.organizationSize || !formData.industry || !formData.roleTitle) ? 0.5 : 1,
                  cursor: (loading || !formData.name || !formData.email || !formData.organization || !formData.organizationSize || !formData.industry || !formData.roleTitle) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-primary)'
                }}
              >
                {loading ? content.processingButton : content.continueButton}
              </button>

            </form>
          </div>

          {/* Back Link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href={`/dma/start?lang=${language}`} style={{ 
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

export default function UserInfoPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserInfoPageContent />
    </Suspense>
  );
}