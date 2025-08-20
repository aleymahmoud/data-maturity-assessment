'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('lang') || 'en';

  // Language-specific content
  const getContent = () => {
    const content = {
      en: {
        language: 'Language',
        title: 'Select Your Role',
        description: 'Your role helps us provide personalized recommendations and relevant action plans. All users will answer the same 35 questions regardless of role selection.',
        languageSection: 'Assessment Language:',
        changeLanguage: 'Change language:',
        note: 'Note:',
        noteText: 'Role selection is used only for personalizing your recommendations. You will see all 35 questions covering the complete data maturity framework.',
        noteLanguage: 'The assessment will be conducted in',
        noteLanguageChange: 'You can change the language above if needed.',
        startButton: 'START ASSESSMENT',
        selectButton: 'SELECT A ROLE TO CONTINUE',
        backLink: 'Back to User Information',
        rolesLabel: 'Roles:',
        focusLabel: 'Focus:',
        warningTitle: 'Important Warning',
        warningText: 'If you close the assessment before answering all 35 questions, you will lose your progress and need to restart the assessment.',
        roles: {
          executive: {
            title: 'Executive/C-Suite Level',
            description: 'CEO, COO, CTO, CDO, VP Strategy',
            focus: 'Strategic decision-making and direction',
            recommendations: 'Strategic leadership recommendations'
          },
          'it-technology': {
            title: 'IT/Technology Department',
            description: 'IT Director, Data Engineer, System Admin',
            focus: 'Technical systems and infrastructure',
            recommendations: 'Technical infrastructure recommendations'
          },
          operations: {
            title: 'Operations & Program Management',
            description: 'Program Manager, Operations Director',
            focus: 'Day-to-day operations and program delivery',
            recommendations: 'Operational efficiency recommendations'
          },
          analytics: {
            title: 'Data & Analytics',
            description: 'Data Analyst, Business Intelligence, Researcher',
            focus: 'Data analysis and insights generation',
            recommendations: 'Analytics and insights recommendations'
          },
          compliance: {
            title: 'Compliance & Risk Management',
            description: 'Compliance Officer, Risk Manager, Legal',
            focus: 'Governance, risk, and regulatory compliance',
            recommendations: 'Governance and compliance recommendations'
          }
        }
      },
      ar: {
        language: 'اللغة',
        title: 'اختر دورك',
        description: 'دورك يساعدنا في تقديم توصيات مخصصة وخطط عمل ذات صلة. جميع المستخدمين سيجيبون على نفس الـ 35 سؤالاً بغض النظر عن اختيار الدور.',
        languageSection: 'لغة التقييم:',
        changeLanguage: 'تغيير اللغة:',
        note: 'ملاحظة:',
        noteText: 'يُستخدم اختيار الدور فقط لتخصيص توصياتك. سترى جميع الأسئلة الـ 35 التي تغطي إطار عمل نضج البيانات الكامل.',
        noteLanguage: 'سيتم إجراء التقييم باللغة',
        noteLanguageChange: 'يمكنك تغيير اللغة أعلاه إذا لزم الأمر.',
        startButton: 'بدء التقييم',
        selectButton: 'اختر دوراً للمتابعة',
        backLink: 'العودة لمعلومات المستخدم',
        rolesLabel: 'الأدوار:',
        focusLabel: 'التركيز:',
        warningTitle: 'تحذير هام',
        warningText: 'إذا أغلقت التقييم قبل الإجابة على جميع الأسئلة الـ 35، ستفقد تقدمك وستحتاج لبدء التقييم من جديد',
        roles: {
          executive: {
            title: 'المستوى التنفيذي/كبار القادة',
            description: 'الرئيس التنفيذي، مدير العمليات، مدير التكنولوجيا، نائب رئيس الاستراتيجية',
            focus: 'اتخاذ القرارات الاستراتيجية والتوجيه',
            recommendations: 'توصيات القيادة الاستراتيجية'
          },
          'it-technology': {
            title: 'قسم تكنولوجيا المعلومات/التكنولوجيا',
            description: 'مدير تكنولوجيا المعلومات، مهندس البيانات، مدير النظم',
            focus: 'الأنظمة التقنية والبنية التحتية',
            recommendations: 'توصيات البنية التحتية التقنية'
          },
          operations: {
            title: 'العمليات وإدارة البرامج',
            description: 'مدير البرامج، مدير العمليات',
            focus: 'العمليات اليومية وتسليم البرامج',
            recommendations: 'توصيات الكفاءة التشغيلية'
          },
          analytics: {
            title: 'البيانات والتحليلات',
            description: 'محلل البيانات، ذكاء الأعمال، باحث',
            focus: 'تحليل البيانات وتوليد الرؤى',
            recommendations: 'توصيات التحليلات والرؤى'
          },
          compliance: {
            title: 'الامتثال وإدارة المخاطر',
            description: 'مسؤول الامتثال، مدير المخاطر، قانوني',
            focus: 'الحوكمة والمخاطر والامتثال التنظيمي',
            recommendations: 'توصيات الحوكمة والامتثال'
          }
        }
      }
    };
    return content[language];
  };

  const content = getContent();

  const roles = [
    {
      id: 'executive',
      ...content.roles.executive
    },
    {
      id: 'it-technology',
      ...content.roles['it-technology']
    },
    {
      id: 'operations',
      ...content.roles.operations
    },
    {
      id: 'analytics',
      ...content.roles.analytics
    },
    {
      id: 'compliance',
      ...content.roles.compliance
    }
  ];

  useEffect(() => {
    // Check if user came from user info
    const userData = sessionStorage.getItem('userData');
    
    if (!userData) {
      router.push(`/user-info?lang=${language}`);
      return;
    }
  }, [router, language]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    // Store role selection
    sessionStorage.setItem('selectedRole', roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      // Navigate to assessment with language and role
      router.push(`/assessment?lang=${language}&role=${selectedRole}&question=0`);
    }
  };

  return (
    <div className={`page-container ${language === 'ar' ? 'rtl' : ''}`}>
      <div className="container">
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          paddingTop: '60px',
          fontFamily: 'var(--font-primary)'
        }}>
          
          {/* Language Confirmation Section */}
          <div className="assessment-card" style={{ marginBottom: '30px', backgroundColor: 'rgba(245, 173, 46, 0.05)' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: '15px',
              flexDirection: language === 'ar' ? 'row-reverse' : 'row'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row'
              }}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                  <span style={{ fontFamily: 'var(--font-primary)', fontWeight: '600' }}>
                    {content.languageSection}
                  </span>
                  <span style={{ 
                    marginLeft: language === 'ar' ? '0' : '8px',
                    marginRight: language === 'ar' ? '8px' : '0',
                    fontSize: '1.1rem', 
                    fontWeight: '500' 
                  }}>
                    {language === 'ar' ? 'العربية (Arabic)' : 'English'}
                  </span>
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row'
              }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {content.changeLanguage}
                </span>
                <select 
                  value={language} 
                  onChange={(e) => {
                    const newLang = e.target.value;
                    router.push(`/role-selection?lang=${newLang}`);
                  }}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    border: '2px solid var(--accent-orange)',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '0.9rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>
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
              lineHeight: '1.6',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.description}
            </p>
          </div>

          {/* Important Note */}
          <div className="assessment-card" style={{ marginBottom: '30px', backgroundColor: 'rgba(127, 122, 254, 0.05)' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              flexDirection: language === 'ar' ? 'row-reverse' : 'row'
            }}>
              <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
              <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                <p style={{ margin: '0', fontWeight: '500', fontFamily: 'var(--font-primary)' }}>
                  <strong>{content.note}</strong> {content.noteText}
                </p>
                <p style={{ 
                  margin: '8px 0 0 0', 
                  fontSize: '0.9rem', 
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-primary)'
                }}>
                  {content.noteLanguage} <strong>{language === 'ar' ? 'العربية' : 'English'}</strong>. 
                  {' '}{content.noteLanguageChange}
                </p>
              </div>
            </div>
          </div>




          {/* Role Cards */}
          <div style={{ marginBottom: '40px' }}>
            {roles.map((role) => (
              <div
                key={role.id}
                className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(role.id)}
                style={{
                  marginBottom: '16px',
                  cursor: 'pointer',
                  border: selectedRole === role.id ? '2px solid var(--primary-navy)' : '2px solid transparent',
                  backgroundColor: selectedRole === role.id ? 'rgba(15, 44, 105, 0.05)' : 'white',
                  direction: language === 'ar' ? 'rtl' : 'ltr'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  flexDirection: language === 'ar' ? 'row-reverse' : 'row'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid var(--primary-navy)',
                    backgroundColor: selectedRole === role.id ? 'var(--primary-navy)' : 'transparent',
                    flexShrink: 0,
                    order: language === 'ar' ? 2 : 1
                  }}>
                    {selectedRole === role.id && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        margin: '4px auto'
                      }} />
                    )}
                  </div>
                  
                  <div style={{ 
                    flex: 1,
                    order: language === 'ar' ? 1 : 2,
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}>
                    <h3 style={{ 
                      marginBottom: '8px', 
                      color: 'var(--primary-navy)',
                      fontSize: '1.2rem',
                      fontFamily: 'var(--font-primary)'
                    }}>
                      🏢 {role.title}
                    </h3>
                    <p style={{ 
                      marginBottom: '4px', 
                      color: 'var(--text-dark)',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-primary)'
                    }}>
                      <strong>{content.rolesLabel}</strong> {role.description}
                    </p>
                    <p style={{ 
                      marginBottom: '4px', 
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-primary)'
                    }}>
                      <strong>{content.focusLabel}</strong> {role.focus}
                    </p>
                    <p style={{ 
                      margin: '0', 
                      color: 'var(--accent-orange)',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      fontFamily: 'var(--font-primary)'
                    }}>
                      🎯 {role.recommendations}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>


                          {/* Warning About Early Exit */}
                <div className="assessment-card" style={{ 
                  marginBottom: '30px', 
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.3)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    flexDirection: 'center'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                      <p style={{ margin: '0', fontWeight: '500', fontFamily: 'var(--font-primary)' }}>
                        <strong>{content.warningTitle}</strong>
                      </p>
                      <p style={{ 
                        margin: '8px 0 0 0', 
                        fontSize: '0.9rem', 
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-primary)'
                      }}>
                        {content.warningText}
                      </p>
                    </div>
                  </div>
                </div>



          {/* Continue Button */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            {selectedRole ? (
              <button 
                onClick={handleContinue}
                className="btn-primary"
                style={{ 
                  fontSize: '1.2rem', 
                  padding: '16px 32px',
                  fontFamily: 'var(--font-primary)'
                }}
              >
                {content.startButton}
              </button>
            ) : (
              <button 
                className="btn-primary" 
                disabled 
                style={{ 
                  fontSize: '1.2rem', 
                  padding: '16px 32px',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  fontFamily: 'var(--font-primary)'
                }}
              >
                {content.selectButton}
              </button>
            )}
          </div>

          {/* Back Link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href={`/user-info?lang=${language}`} style={{ 
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


useEffect(() => {
  // Check if we're resuming - load existing user data
  const resumeData = sessionStorage.getItem('resumeData');
  if (resumeData) {
    const data = JSON.parse(resumeData);
    // Auto-detect role from roleTitle
    const roleMapping = {
      'CEO': 'executive',
      'COO': 'executive', 
      'CTO': 'executive',
      // ... add all mappings
    };
    
    const detectedRole = Object.keys(roleMapping).find(key => 
      data.userData.roleTitle.toLowerCase().includes(key.toLowerCase())
    );
    
    if (detectedRole) {
      setSelectedRole(roleMapping[detectedRole]);
    }
  }
}, []);