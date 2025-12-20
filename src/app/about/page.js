import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import '../landing.css';

export const metadata = {
  title: 'About Us | Omnisight Analytics',
  description: 'Learn about Omnisight Analytics - a team of data experts helping organizations unlock the true potential of their data.',
};

export default function AboutPage() {
  return (
    <div className="landing-page">
      <Navbar />

      {/* Page Header */}
      <header className="landing-page-header">
        <h1>About Us</h1>
        <p>Empowering organizations with data-driven insights</p>
      </header>

      {/* About Content */}
      <section className="landing-section">
        <div className="landing-about-content">
          <div className="landing-about-text">
            <h2>Our Story</h2>
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

      {/* Values Section */}
      <section className="landing-section landing-section-dark">
        <div className="landing-section-title">
          <h2>Our Values</h2>
          <p>The principles that guide everything we do</p>
        </div>
        <div className="landing-services-grid">
          <div className="landing-service-card">
            <div className="landing-service-icon">🎯</div>
            <h3>Excellence</h3>
            <p>
              We strive for excellence in everything we do, from the tools we build
              to the advice we provide. Quality is non-negotiable.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">🤝</div>
            <h3>Partnership</h3>
            <p>
              We work alongside our clients as true partners, understanding their
              unique challenges and celebrating their successes.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">💡</div>
            <h3>Innovation</h3>
            <p>
              We continuously innovate and stay ahead of industry trends to bring
              the best solutions to our clients.
            </p>
          </div>
          <div className="landing-service-card">
            <div className="landing-service-icon">🌍</div>
            <h3>Accessibility</h3>
            <p>
              We believe data excellence should be accessible to all organizations,
              which is why we offer free tools alongside our premium services.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section landing-contact">
        <h2>Let&apos;s Work Together</h2>
        <p>
          Ready to transform your data capabilities? We&apos;d love to hear from you.
        </p>
        <Link href="/contact" className="landing-btn landing-btn-primary">
          Contact Us
        </Link>
      </section>

      <Footer />
    </div>
  );
}
