'use client';

import Link from 'next/link';
import Navbar from './components/landing/Navbar';
import Footer from './components/landing/Footer';
import './landing.css';

export default function HomePage() {
  return (
    <div className="landing-page">
      <Navbar />

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1>Unlock the Power of Your Data</h1>
          <p>
            Transform your organization with data-driven insights. We help businesses
            harness the full potential of their data through advanced analytics,
            strategic consulting, and innovative tools.
          </p>
          <div className="landing-hero-buttons">
            <Link href="/dma" className="landing-btn landing-btn-primary">
              Start Assessment
            </Link>
            <Link href="/services" className="landing-btn landing-btn-secondary">
              Our Services
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Services Overview */}
      <section className="landing-section">
        <div className="landing-section-title">
          <h2>What We Do</h2>
          <p>Comprehensive data solutions tailored to your business needs</p>
        </div>
        <div className="landing-services-grid">
          <div className="landing-service-card">
            <div className="landing-service-icon">📊</div>
            <h3>Data Strategy</h3>
            <p>
              Develop a comprehensive data strategy aligned with your business goals
              and implementation roadmaps.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">🔍</div>
            <h3>Analytics & Insights</h3>
            <p>
              Turn raw data into actionable insights to make informed decisions
              and identify growth opportunities.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">🛡️</div>
            <h3>Data Governance</h3>
            <p>
              Establish robust data governance practices to ensure data quality,
              security, and compliance.
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/services" className="landing-btn landing-btn-primary" style={{ background: 'var(--omnisight-gradient)' }}>
            View All Services
          </Link>
        </div>
      </section>

      {/* Featured Tool */}
      <section className="landing-section landing-section-dark">
        <div className="landing-section-title">
          <h2>Featured Tool</h2>
          <p>Assess and improve your data capabilities</p>
        </div>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Link href="/dma" className="landing-tool-card">
            <span className="landing-tool-badge">Free Assessment</span>
            <h3>Data Maturity Assessment</h3>
            <p>
              Evaluate your organization&apos;s data capabilities across 11 key dimensions.
              Get personalized recommendations to advance your data maturity journey.
            </p>
            <ul className="landing-tool-features">
              <li>Role-based assessment tailored to your position</li>
              <li>Instant maturity score and detailed analysis</li>
              <li>Actionable recommendations for improvement</li>
            </ul>
            <span className="landing-tool-cta">Start Free Assessment</span>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-section">
        <div className="landing-about-stats" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="landing-stat">
            <span className="landing-stat-number">500+</span>
            <span className="landing-stat-label">Assessments Completed</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-number">50+</span>
            <span className="landing-stat-label">Organizations Served</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-number">11</span>
            <span className="landing-stat-label">Maturity Dimensions</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-number">5</span>
            <span className="landing-stat-label">Role-Based Tracks</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section landing-contact">
        <h2>Ready to Get Started?</h2>
        <p>
          Take the first step towards data excellence with our free assessment tool.
        </p>
        <Link href="/dma" className="landing-btn landing-btn-primary">
          Start Your Assessment
        </Link>
      </section>

      <Footer />
    </div>
  );
}
