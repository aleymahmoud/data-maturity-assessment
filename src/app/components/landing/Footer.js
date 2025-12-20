import Link from 'next/link';

export default function Footer() {
  return (
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
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/tools">Tools</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/contact">Contact</Link></li>
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
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="landing-footer-bottom">
        © {new Date().getFullYear()} Omnisight Analytics. All rights reserved.
      </div>
    </footer>
  );
}
