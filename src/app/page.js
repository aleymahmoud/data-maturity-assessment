'use client';

import { useState } from 'react';
import Link from 'next/link';
import './landing.css';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <Link href="/" className="landing-logo">
          <span className="landing-logo-icon">O</span>
          Omnisight Analytics
        </Link>

        <button
          className="landing-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`landing-nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <li><a href="#services" onClick={() => scrollToSection('services')}>Services</a></li>
          <li><a href="#tools" onClick={() => scrollToSection('tools')}>Tools</a></li>
          <li><a href="#about" onClick={() => scrollToSection('about')}>About</a></li>
          <li><a href="#contact" onClick={() => scrollToSection('contact')}>Contact</a></li>
          <li><Link href="/dma" className="landing-nav-cta">Get Started</Link></li>
        </ul>
      </nav>

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
            <a
              href="#services"
              className="landing-btn landing-btn-secondary"
              onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="landing-section">
        <div className="landing-section-title">
          <h2>Our Services</h2>
          <p>Comprehensive data solutions tailored to your business needs</p>
        </div>
        <div className="landing-services-grid">
          <div className="landing-service-card">
            <div className="landing-service-icon">📊</div>
            <h3>Data Strategy</h3>
            <p>
              Develop a comprehensive data strategy aligned with your business goals.
              We help you define roadmaps, governance frameworks, and implementation plans.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">🔍</div>
            <h3>Analytics & Insights</h3>
            <p>
              Turn raw data into actionable insights. Our advanced analytics solutions
              help you make informed decisions and identify growth opportunities.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">🛡️</div>
            <h3>Data Governance</h3>
            <p>
              Establish robust data governance practices to ensure data quality,
              security, and compliance with industry regulations.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">🚀</div>
            <h3>Digital Transformation</h3>
            <p>
              Modernize your data infrastructure and processes. We guide you through
              the journey of becoming a truly data-driven organization.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">🎓</div>
            <h3>Training & Enablement</h3>
            <p>
              Empower your team with data literacy programs and hands-on training
              to maximize the value of your data investments.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">🤖</div>
            <h3>AI & Machine Learning</h3>
            <p>
              Leverage cutting-edge AI and ML technologies to automate processes,
              predict trends, and gain competitive advantages.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="landing-section landing-section-dark">
        <div className="landing-section-title">
          <h2>Our Tools</h2>
          <p>Powerful tools to assess and improve your data capabilities</p>
        </div>
        <div className="landing-tools-grid">
          <Link href="/dma" className="landing-tool-card">
            <span className="landing-tool-badge">Free Assessment</span>
            <h3>Data Maturity Assessment</h3>
            <p>
              Evaluate your organization&apos;s data capabilities across 11 key dimensions.
              Get personalized recommendations to advance your data maturity journey.
            </p>
            <ul className="landing-tool-features">
              <li>Role-based assessment tailored to your position</li>
              <li>Comprehensive evaluation across all data domains</li>
              <li>Instant maturity score and detailed analysis</li>
              <li>Actionable recommendations for improvement</li>
              <li>Available in English and Arabic</li>
            </ul>
            <span className="landing-tool-cta">Start Free Assessment</span>
          </Link>
          <div className="landing-tool-card" style={{ opacity: 0.7 }}>
            <span className="landing-tool-badge" style={{ background: '#999' }}>Coming Soon</span>
            <h3>Data Quality Dashboard</h3>
            <p>
              Monitor and improve your data quality in real-time. Track key metrics,
              identify issues, and ensure your data meets the highest standards.
            </p>
            <ul className="landing-tool-features">
              <li>Real-time data quality monitoring</li>
              <li>Automated issue detection and alerts</li>
              <li>Quality score tracking over time</li>
              <li>Integration with popular data platforms</li>
            </ul>
            <span className="landing-tool-cta" style={{ color: '#999' }}>Coming Soon</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="landing-section">
        <div className="landing-about-content">
          <div className="landing-about-text">
            <h2>About Omnisight Analytics</h2>
            <p>
              We are a team of data experts passionate about helping organizations
              unlock the true potential of their data. With years of experience across
              various industries, we understand the unique challenges businesses face
              in their data journey.
            </p>
            <p>
              Our mission is to democratize data excellence by providing accessible
              tools, expert guidance, and practical solutions that drive real business
              outcomes. Whether you&apos;re just starting your data journey or looking
              to optimize your existing capabilities, we&apos;re here to help.
            </p>
            <p>
              We believe that every organization, regardless of size or industry,
              can become data-driven with the right approach and support.
            </p>
          </div>
          <div className="landing-about-stats">
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
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="landing-section landing-contact">
        <h2>Get In Touch</h2>
        <p>
          Ready to transform your data capabilities? Contact us to learn how
          we can help your organization achieve data excellence.
        </p>
        <Link href="/dma" className="landing-btn landing-btn-primary">
          Start Your Assessment
        </Link>
        <div className="landing-contact-info">
          <div className="landing-contact-item">
            <span>📧</span>
            <span>info@omnisightanalytics.com</span>
          </div>
          <div className="landing-contact-item">
            <span>🌐</span>
            <span>www.omnisightanalytics.com</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-section">
            <h4>Omnisight Analytics</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              Empowering organizations with data-driven insights and solutions.
            </p>
          </div>
          <div className="landing-footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#tools">Tools</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="landing-footer-section">
            <h4>Tools</h4>
            <ul>
              <li><Link href="/dma">Data Maturity Assessment</Link></li>
            </ul>
          </div>
          <div className="landing-footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="landing-footer-bottom">
          © {new Date().getFullYear()} Omnisight Analytics. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
