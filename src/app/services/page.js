import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import '../landing.css';

export const metadata = {
  title: 'Services | Omnisight Analytics',
  description: 'Comprehensive data services including strategy, analytics, governance, digital transformation, training, and AI/ML solutions.',
};

export default function ServicesPage() {
  const services = [
    {
      icon: '📊',
      title: 'Data Strategy',
      description: 'Develop a comprehensive data strategy aligned with your business goals. We help you define roadmaps, governance frameworks, and implementation plans that drive measurable outcomes.',
      features: ['Strategic roadmap development', 'Data architecture design', 'Technology selection', 'ROI analysis and business case development']
    },
    {
      icon: '🔍',
      title: 'Analytics & Insights',
      description: 'Turn raw data into actionable insights. Our advanced analytics solutions help you make informed decisions and identify growth opportunities through data-driven analysis.',
      features: ['Business intelligence dashboards', 'Predictive analytics', 'Customer analytics', 'Performance metrics and KPIs']
    },
    {
      icon: '🛡️',
      title: 'Data Governance',
      description: 'Establish robust data governance practices to ensure data quality, security, and compliance with industry regulations and standards.',
      features: ['Data quality management', 'Metadata management', 'Compliance frameworks', 'Data security policies']
    },
    {
      icon: '🚀',
      title: 'Digital Transformation',
      description: 'Modernize your data infrastructure and processes. We guide you through the journey of becoming a truly data-driven organization.',
      features: ['Legacy system modernization', 'Cloud migration strategy', 'Process automation', 'Change management']
    },
    {
      icon: '🎓',
      title: 'Training & Enablement',
      description: 'Empower your team with data literacy programs and hands-on training to maximize the value of your data investments.',
      features: ['Data literacy programs', 'Tool-specific training', 'Best practices workshops', 'Certification preparation']
    },
    {
      icon: '🤖',
      title: 'AI & Machine Learning',
      description: 'Leverage cutting-edge AI and ML technologies to automate processes, predict trends, and gain competitive advantages.',
      features: ['ML model development', 'AI strategy consulting', 'Natural language processing', 'Computer vision solutions']
    }
  ];

  return (
    <div className="landing-page">
      <Navbar />

      {/* Page Header */}
      <header className="landing-page-header">
        <h1>Our Services</h1>
        <p>Comprehensive data solutions to transform your organization</p>
      </header>

      {/* Services Grid */}
      <section className="landing-section">
        <div className="landing-services-grid">
          {services.map((service, index) => (
            <div key={index} className="landing-service-card">
              <div className="landing-service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ul className="landing-tool-features" style={{ marginTop: '1rem' }}>
                {service.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section landing-contact">
        <h2>Need a Custom Solution?</h2>
        <p>
          Contact us to discuss how we can help your organization achieve its data goals.
        </p>
        <Link href="/contact" className="landing-btn landing-btn-primary">
          Get in Touch
        </Link>
      </section>

      <Footer />
    </div>
  );
}
