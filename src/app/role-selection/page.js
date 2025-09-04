'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RoleSelectionPageContent() {
  const [selectedRole, setSelectedRole] = useState('');
  const [userId, setUserId] = useState(''); 
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

const [roles, setRoles] = useState([]);
const [rolesLoading, setRolesLoading] = useState(true);

// Load roles from database
useEffect(() => {
  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await fetch(`/api/roles?lang=${language}`);
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.roles);
        console.log('Loaded roles from database:', data.roles);
      } else {
        console.error('Failed to load roles:', data.error);
        // Fallback to hardcoded roles if database fails
        setRoles(getDefaultRoles());
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles(getDefaultRoles());
    } finally {
      setRolesLoading(false);
    }
  };
  
  loadRoles();
}, [language]);

// Fallback roles in case database fails
const getDefaultRoles = () => [
  {
    id: 'executive',
    name: language === 'ar' ? 'المستوى التنفيذي/كبار القادة' : 'Executive/C-Suite Level',
    description: language === 'ar' ? 'الرئيس التنفيذي، مدير العمليات، مدير التكنولوجيا، نائب رئيس الاستراتيجية' : 'CEO, COO, CTO, CDO, VP Strategy',
    focus: language === 'ar' ? 'اتخاذ القرارات الاستراتيجية والتوجيه' : 'Strategic decision-making and direction',
    recommendations: language === 'ar' ? 'توصيات القيادة الاستراتيجية' : 'Strategic leadership recommendations'
  },
  // ... other default roles
];

useEffect(() => {
  // Check if user came from user info OR if we're resuming
  const userData = sessionStorage.getItem('userData');
  const resumeData = sessionStorage.getItem('resumeData');
  
  if (!userData && !resumeData) {
    router.push(`/user-info?lang=${language}`);
    return;
  }

  // If resuming, get role from database
  if (resumeData) {
    const data = JSON.parse(resumeData);
    console.log('FULL resumeData contents:', data.userData);
    setUserId(data.userData.userId); // Store userId for API calls
    
    console.log('Resume data selectedRole:', data.userData.selectedRole);
    
    // Use database stored role if available
    if (data.userData.selectedRole) {
      console.log('Using database stored role:', data.userData.selectedRole);
      setSelectedRole(data.userData.selectedRole);
      return; // ← IMPORTANT: Exit here, don't run auto-detection
    } 
    
    // ONLY auto-detect if NO stored role exists
    console.log('No stored role found, auto-detecting...');
    const roleTitle = data.userData.roleTitle.toLowerCase();
    let detectedRole = 'executive'; // default
    
    // Complete role detection logic
    if (roleTitle.includes('ceo') || roleTitle.includes('chief executive') || 
        roleTitle.includes('coo') || roleTitle.includes('chief operating') ||
        roleTitle.includes('cto') || roleTitle.includes('chief technology') ||
        roleTitle.includes('cdo') || roleTitle.includes('chief data') ||
        roleTitle.includes('vp') || roleTitle.includes('vice president') ||
        roleTitle.includes('president') || roleTitle.includes('executive director')) {
      detectedRole = 'executive';
    }
    else if (roleTitle.includes('it director') || roleTitle.includes('data engineer') ||
             roleTitle.includes('system admin') || roleTitle.includes('infrastructure') ||
             roleTitle.includes('technical lead') || roleTitle.includes('software') ||
             roleTitle.includes('devops') || roleTitle.includes('network')) {
      detectedRole = 'it-technology';
    }
    else if (roleTitle.includes('data analyst') || roleTitle.includes('business intelligence') ||
             roleTitle.includes('bi analyst') || roleTitle.includes('data scientist') ||
             roleTitle.includes('researcher') || roleTitle.includes('analytics')) {
      detectedRole = 'analytics';
    }
    else if (roleTitle.includes('program manager') || roleTitle.includes('operations') ||
             roleTitle.includes('product manager') || roleTitle.includes('business manager') ||
             roleTitle.includes('project manager')) {
      detectedRole = 'operations';
    }
    else if (roleTitle.includes('compliance') || roleTitle.includes('risk') ||
             roleTitle.includes('legal') || roleTitle.includes('privacy') ||
             roleTitle.includes('governance') || roleTitle.includes('audit')) {
      detectedRole = 'compliance';
    }
    
    console.log('Auto-detected role:', detectedRole);
    setSelectedRole(detectedRole);
  } else {
    // Normal flow - no userId available yet for role storage
    console.log('Normal flow - no userId available yet for role storage');
  }
}, [router, language]);


// Temporary debug - add this after your existing useEffect
useEffect(() => {
  console.log('=== ROLE SELECTION DEBUG ===');
  console.log('userId state:', userId);
  console.log('selectedRole state:', selectedRole);
  console.log('sessionStorage userData:', sessionStorage.getItem('userData'));
  console.log('sessionStorage resumeData:', sessionStorage.getItem('resumeData'));
}, [userId, selectedRole]);



// Load roles from database
useEffect(() => {
  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await fetch(`/api/roles?lang=${language}`);
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.roles);
        console.log('Loaded roles from database:', data.roles);
      } else {
        console.error('Failed to load roles:', data.error);
        setRoles([]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };
  
  loadRoles();
}, [language]);


const handleRoleSelect = async (roleId) => {
  setSelectedRole(roleId);
  
  // Store in sessionStorage for immediate use
  sessionStorage.setItem('selectedRole', roleId);
  
  // Save to database if we have userId
  if (userId) {
    try {
      const response = await fetch('/api/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          selectedRole: roleId
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('Role saved to database successfully');
      } else {
        console.error('Failed to save role to database:', result.error);
      }
    } catch (error) {
      console.error('Error saving role to database:', error);
    }
  }
};

const handleContinue = async () => {
  if (selectedRole) {
    // Store role in sessionStorage for immediate use
    sessionStorage.setItem('selectedRole', selectedRole);
    
    // CRITICAL FIX: Only update userData for NEW users, not returning users
    const resumeData = sessionStorage.getItem('resumeData');
    
    if (!resumeData) {
      // NEW USER: Store in userData so it gets passed to session creation
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      userData.selectedRole = selectedRole;
      sessionStorage.setItem('userData', JSON.stringify(userData));
      
      console.log('NEW USER: Stored selectedRole in userData:', selectedRole);
    } else {
      // RETURNING USER: Don't update userData, role already saved to database
      console.log('RETURNING USER: Role already saved to database, not updating userData');
    }
    
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
                    fontWeight: '500' ,
                    fontFamily: 'var(--font-primary)'
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
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
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
  {rolesLoading ? (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <p>{language === 'ar' ? 'جاري تحميل الأدوار...' : 'Loading roles...'}</p>
    </div>
  ) : (
    roles.map((role) => (
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
              🏢 {role.name}
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
    ))
  )}
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

// Add this function to role selection page
const loadRolesFromDatabase = async () => {
  try {
    const response = await fetch('/api/roles');
    const data = await response.json();
    if (data.success) {
      return data.roles;
    }
  } catch (error) {
    console.error('Error loading roles:', error);
  }
  return []; // fallback to empty array
};

export default function RoleSelectionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoleSelectionPageContent />
    </Suspense>
  );
}