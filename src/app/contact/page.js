'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import '../landing.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just show success message
    // In production, this would send to an API
    setSubmitted(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="landing-page">
      <Navbar />

      {/* Page Header */}
      <header className="landing-page-header">
        <h1>Contact Us</h1>
        <p>Get in touch with our team</p>
      </header>

      {/* Contact Content */}
      <section className="landing-section">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {!submitted ? (
            <>
              <div className="landing-section-title">
                <h2>Send Us a Message</h2>
                <p>Fill out the form below and we&apos;ll get back to you shortly</p>
              </div>

              <form onSubmit={handleSubmit} className="landing-contact-form">
                <div className="landing-form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>

                <div className="landing-form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@company.com"
                  />
                </div>

                <div className="landing-form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Your company name"
                  />
                </div>

                <div className="landing-form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="How can we help you?"
                  />
                </div>

                <button type="submit" className="landing-form-submit">
                  Send Message
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ color: 'var(--omnisight-primary)', marginBottom: '1rem' }}>
                Message Sent!
              </h2>
              <p style={{ color: 'var(--omnisight-text-light)', marginBottom: '2rem' }}>
                Thank you for reaching out. We&apos;ll get back to you as soon as possible.
              </p>
              <Link href="/" className="landing-btn landing-btn-primary" style={{ background: 'var(--omnisight-gradient)' }}>
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Contact Info */}
      <section className="landing-section landing-section-dark">
        <div className="landing-section-title">
          <h2>Other Ways to Reach Us</h2>
        </div>
        <div className="landing-services-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="landing-service-card" style={{ textAlign: 'center' }}>
            <div className="landing-service-icon" style={{ margin: '0 auto 1rem' }}>📧</div>
            <h3>Email</h3>
            <p>info@omnisightanalytics.com</p>
          </div>
          <div className="landing-service-card" style={{ textAlign: 'center' }}>
            <div className="landing-service-icon" style={{ margin: '0 auto 1rem' }}>🌐</div>
            <h3>Website</h3>
            <p>www.omnisightanalytics.com</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
