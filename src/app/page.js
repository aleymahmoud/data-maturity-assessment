'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [language, setLanguage] = useState('en');

  return (
    <div className="page-container">
      <div className="container">
        <div className="welcome-container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '60px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>
              DATA MATURITY
            </h1>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--secondary-blue)', marginBottom: '30px' }}>
              ASSESSMENT TOOL
            </h2>
          </div>

          {/* Main Features */}
          <div className="assessment-card" style={{ textAlign: 'left', marginBottom: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px', alignItems: 'start' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <span>Evaluate your organization's data capabilities across 11 key dimensions</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                <span><strong>Time:</strong> 25-30 minutes</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
                <span><strong>Questions:</strong> 35 comprehensive questions</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                <span>Your responses are confidential</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📈</span>
                <span>Get personalized recommendations</span>
              </div>

            </div>
          </div>

          {/* Language Selection */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{ marginRight: '15px', fontFamily: 'var(--font-primary)', fontWeight: '600' }}>
              Language:
            </label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '6px', 
                border: '2px solid var(--light-gray)',
                fontFamily: 'var(--font-primary)',
                marginRight: '15px'
              }}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* Start Button */}
          <Link href="/code-entry" className="btn-primary" style={{ 
            fontSize: '1.2rem', 
            padding: '16px 32px',
            textDecoration: 'none' 
          }}>
            START ASSESSMENT
          </Link>

          {/* Privacy Notice */}
          <p style={{ 
            marginTop: '30px', 
            fontSize: '0.9rem', 
            color: 'var(--text-light)',
            fontStyle: 'italic' 
          }}>
            This assessment is designed to help organizations understand their current data maturity level 
            and identify areas for improvement. All responses are confidential and used only for generating 
            your personalized recommendations.
          </p>

        </div>
      </div>
    </div>
  );
}