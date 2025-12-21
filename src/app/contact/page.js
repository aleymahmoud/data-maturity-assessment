'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import '../landing.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    type: 'consultation',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    jobTitle: '',
    organizationName: '',
    organizationSize: '',
    industry: '',
    country: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/org-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const organizationSizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance & Banking',
    'Retail & E-commerce',
    'Manufacturing',
    'Education',
    'Government',
    'Energy & Utilities',
    'Telecommunications',
    'Media & Entertainment',
    'Transportation & Logistics',
    'Real Estate',
    'Other'
  ];

  return (
    <div className="landing-page">
      <Navbar />

      {/* Page Header */}
      <header className="landing-page-header">
        <h1>Contact Us</h1>
        <p>Get in touch with our team for consultations and inquiries</p>
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

              {error && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="landing-contact-form">
                {/* Request Type */}
                <div className="landing-form-group">
                  <label htmlFor="type">What can we help you with? *</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #eee',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="consultation">General Consultation</option>
                    <option value="dma">Data Maturity Assessment</option>
                  </select>
                </div>

                {/* Contact Information */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    marginBottom: '16px'
                  }}>
                    Contact Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="landing-form-group" style={{ margin: 0 }}>
                      <label htmlFor="contactName">Full Name *</label>
                      <input
                        type="text"
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="landing-form-group" style={{ margin: 0 }}>
                      <label htmlFor="contactEmail">Email *</label>
                      <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        required
                        placeholder="your.email@company.com"
                      />
                    </div>

                    <div className="landing-form-group" style={{ margin: 0 }}>
                      <label htmlFor="contactPhone">Phone Number</label>
                      <input
                        type="tel"
                        id="contactPhone"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div className="landing-form-group" style={{ margin: 0 }}>
                      <label htmlFor="jobTitle">Job Title</label>
                      <input
                        type="text"
                        id="jobTitle"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        placeholder="Your position"
                      />
                    </div>
                  </div>
                </div>

                {/* Organization Information */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    marginBottom: '16px'
                  }}>
                    Organization Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="landing-form-group" style={{ margin: 0 }}>
                      <label htmlFor="organizationName">Organization Name *</label>
                      <input
                        type="text"
                        id="organizationName"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleChange}
                        required
                        placeholder="Your company name"
                      />
                    </div>

                    <div className="landing-form-group" style={{ margin: 0 }}>
                      <label htmlFor="organizationSize">Organization Size</label>
                      <select
                        id="organizationSize"
                        name="organizationSize"
                        value={formData.organizationSize}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #eee',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                      >
                        <option value="">Select size</option>
                        {organizationSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>

                    <div className="landing-form-group" style={{ margin: 0 }}>
                      <label htmlFor="industry">Industry</label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #eee',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                      >
                        <option value="">Select industry</option>
                        {industries.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>

                    <div className="landing-form-group" style={{ margin: 0 }}>
                      <label htmlFor="country">Country</label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="Your country"
                      />
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="landing-form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your data challenges or what you'd like to discuss..."
                    rows={5}
                  />
                </div>

                <button
                  type="submit"
                  className="landing-form-submit"
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ color: 'var(--omnisight-primary)', marginBottom: '1rem' }}>
                Request Submitted!
              </h2>
              <p style={{ color: 'var(--omnisight-text-light)', marginBottom: '2rem' }}>
                Thank you for reaching out. Our team will review your request and get back to you as soon as possible.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/" className="landing-btn landing-btn-primary" style={{ background: 'var(--omnisight-gradient)' }}>
                  Back to Home
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      type: 'consultation',
                      contactName: '',
                      contactEmail: '',
                      contactPhone: '',
                      jobTitle: '',
                      organizationName: '',
                      organizationSize: '',
                      industry: '',
                      country: '',
                      message: ''
                    });
                  }}
                  className="landing-btn landing-btn-secondary"
                  style={{ border: '2px solid var(--omnisight-primary)', color: 'var(--omnisight-primary)' }}
                >
                  Submit Another Request
                </button>
              </div>
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
