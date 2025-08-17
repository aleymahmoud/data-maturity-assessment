'use client';

import Link from 'next/link';
import { useState } from 'react';
import { roles } from '../../data/roles';

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  return (
    <div className="page-container">
      <div className="container">
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '40px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1>SELECT YOUR ROLE FOR PERSONALIZED RESULTS</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '20px 0' }}>
              All participants complete the same comprehensive assessment. Your role helps us provide 
              personalized recommendations and relevant action plans.
            </p>
          </div>

          {/* Role Cards */}
          <div style={{ marginBottom: '40px' }}>
            {Object.values(roles).map((role) => (
              <div
                key={role.id}
                className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(role.id)}
                style={{ 
                  cursor: 'pointer',
                  padding: '16px',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  
                  {/* Icon */}
                  <div style={{ fontSize: '1.5rem' }}>
                    {role.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '4px', color: 'var(--primary-navy)', fontSize: '1.1rem' }}>
                      {role.title}
                    </h3>
                    
                    <p style={{ marginBottom: '0', color: 'var(--text-dark)', fontSize: '0.9rem' }}>
                      {role.description}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {selectedRole === role.id && (
                    <div style={{ 
                      color: 'var(--primary-navy)', 
                      fontSize: '1.2rem'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <div style={{ textAlign: 'center' }}>
            {selectedRole ? (
              <Link 
                href={`/assessment?role=${selectedRole}&question=0`} 
                className="btn-primary"
                style={{ 
                  fontSize: '1.2rem', 
                  padding: '16px 32px',
                  textDecoration: 'none' 
                }}
              >
                START ASSESSMENT
              </Link>
            ) : (
              <button 
                className="btn-primary" 
                disabled 
                style={{ 
                  fontSize: '1.2rem', 
                  padding: '16px 32px',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                SELECT A ROLE TO CONTINUE
              </button>
            )}
          </div>

          {/* Back Link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              ← Back to Welcome
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}