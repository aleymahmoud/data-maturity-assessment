'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useState } from 'react';

function HomePageContent() {
  const [language, setLanguage] = useState('en');

  // Language-specific content
  const getContent = () => {
    const content = {
      en: {
        title: 'DATA MATURITY',
        subtitle: 'ASSESSMENT TOOL',
        feature1: 'Evaluate your organization\'s data capabilities across 11 key dimensions',
        feature2: 'Time: 25-30 minutes',
        feature3: 'Questions: Tailored question set for your organization',
        feature4: 'Your responses are confidential',
        feature5: 'Get personalized recommendations',
        language: 'Language:',
        startButton: 'START ASSESSMENT',
        privacy: 'This assessment is designed to help organizations understand their current data maturity level and identify areas for improvement. All responses are confidential and used only for generating your personalized recommendations.'
      },
      ar: {
        title: 'DATA MATURITY',
        subtitle: 'ASSESSMENT TOOL',
        feature1: 'قيّم قدرات مؤسستك في البيانات عبر 11 بُعداً رئيسياً',
        feature2: 'الوقت: 25-30 دقيقة',
        feature3: 'الأسئلة: مجموعة أسئلة مخصصة لمؤسستك',
        feature4: 'إجاباتك سرية',
        feature5: 'احصل على توصيات مخصصة',
        language: 'اللغة:',
        startButton: 'بدء التقييم',
        privacy: 'تم تصميم هذا التقييم لمساعدة المؤسسات على فهم مستوى نضج البيانات الحالي وتحديد مجالات التحسين. جميع الإجابات سرية وتُستخدم فقط لإنتاج التوصيات المخصصة لك.'
      }
    };
    return content[language];
  };

  const content = getContent();

  return (
    <div className={`page-container ${language === 'ar' ? 'rtl' : ''}`}>
      <div className="container">
        <div className="welcome-container" style={{ 
          maxWidth: '950px', 
          margin: '0 auto', 
          textAlign: 'center', 
          paddingTop: '60px',
          fontFamily: 'var(--font-primary)'
        }}>
          
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              marginBottom: '10px',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.title}
            </h1>
            <h2 style={{ 
              fontSize: '2.2rem', 
              color: 'var(--secondary-blue)', 
              marginBottom: '30px',
              fontFamily: 'var(--font-primary)'
            }}>
              {content.subtitle}
            </h2>
          </div>

          {/* Main Features */}
          <div className="assessment-card" style={{ 
            textAlign: language === 'ar' ? 'right' : 'left', 
            marginBottom: '30px' 
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto 1fr', 
              gap: '20px', 
              alignItems: 'start',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row'
              }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <span style={{ fontFamily: 'var(--font-primary)' }}>{content.feature1}</span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row'
              }}>
                <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                <span style={{ fontFamily: 'var(--font-primary)' }}>
                  <strong>{content.feature2}</strong>
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row'
              }}>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
                <span style={{ fontFamily: 'var(--font-primary)' }}>
                  <strong>{content.feature3}</strong>
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                <span style={{ fontFamily: 'var(--font-primary)' }}>{content.feature4}</span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                flexDirection: language === 'ar' ? 'row-reverse' : 'row'
              }}>
                <span style={{ fontSize: '1.5rem' }}>📈</span>
                <span style={{ fontFamily: 'var(--font-primary)' }}>{content.feature5}</span>
              </div>

            </div>
          </div>

          {/* Language Selection */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{ 
              marginRight: language === 'ar' ? '0' : '15px',
              marginLeft: language === 'ar' ? '15px' : '0',
              fontFamily: 'var(--font-primary)', 
              fontWeight: '600' 
            }}>
              {content.language}
            </label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '6px', 
                border: '2px solid var(--light-gray)',
                fontFamily: 'var(--font-primary)',
                marginRight: language === 'ar' ? '15px' : '0',
                marginLeft: language === 'ar' ? '0' : '15px'
              }}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* Start Button */}
          <Link href={`/dma/start?lang=${language}`} className="btn-primary" style={{ 
            fontSize: '1.2rem', 
            padding: '16px 32px',
            textDecoration: 'none',
            fontFamily: 'var(--font-primary)'
          }}>
            {content.startButton}
          </Link>
          


          {/* Privacy Notice */}
          <p style={{ 
            marginTop: '30px', 
            fontSize: '0.9rem', 
            color: 'var(--text-light)',
            fontStyle: 'italic',
            fontFamily: 'var(--font-primary)',
            textAlign: language === 'ar' ? 'right' : 'left',
            lineHeight: '1.6'
          }}>
            {content.privacy}
          </p>

        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}