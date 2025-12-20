import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import '../landing.css';

export const metadata = {
  title: 'Tools | Omnisight Analytics',
  description: 'Powerful tools to assess and improve your data capabilities. Try our free Data Maturity Assessment.',
};

export default function ToolsPage() {
  return (
    <div className="landing-page">
      <Navbar />

      {/* Page Header */}
      <header className="landing-page-header">
        <h1>Our Tools</h1>
        <p>Powerful tools to assess and improve your data capabilities</p>
      </header>

      {/* Tools Grid */}
      <section className="landing-section">
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

          <div className="landing-tool-card" style={{ opacity: 0.7 }}>
            <span className="landing-tool-badge" style={{ background: '#999' }}>Coming Soon</span>
            <h3>Data Catalog</h3>
            <p>
              Discover, understand, and trust your data. A centralized catalog for all
              your data assets with lineage tracking and collaboration features.
            </p>
            <ul className="landing-tool-features">
              <li>Centralized data asset inventory</li>
              <li>Data lineage visualization</li>
              <li>Automated metadata discovery</li>
              <li>Collaboration and knowledge sharing</li>
            </ul>
            <span className="landing-tool-cta" style={{ color: '#999' }}>Coming Soon</span>
          </div>

          <div className="landing-tool-card" style={{ opacity: 0.7 }}>
            <span className="landing-tool-badge" style={{ background: '#999' }}>Coming Soon</span>
            <h3>Analytics ROI Calculator</h3>
            <p>
              Calculate the potential return on investment for your analytics initiatives.
              Make data-driven decisions about your data investments.
            </p>
            <ul className="landing-tool-features">
              <li>Cost-benefit analysis</li>
              <li>Industry benchmarks</li>
              <li>Custom scenario modeling</li>
              <li>Executive-ready reports</li>
            </ul>
            <span className="landing-tool-cta" style={{ color: '#999' }}>Coming Soon</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section landing-contact">
        <h2>Start Your Data Journey Today</h2>
        <p>
          Begin with our free Data Maturity Assessment to understand where you stand.
        </p>
        <Link href="/dma" className="landing-btn landing-btn-primary">
          Take the Assessment
        </Link>
      </section>

      <Footer />
    </div>
  );
}
