import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import '../landing.css';

export const metadata = {
  title: 'Blog | Omnisight Analytics',
  description: 'Insights, tips, and best practices for data management, analytics, and organizational data maturity.',
};

export default function BlogPage() {
  const posts = [
    {
      slug: 'what-is-data-maturity',
      title: 'What is Data Maturity and Why Does It Matter?',
      excerpt: 'Understanding data maturity is the first step towards becoming a data-driven organization. Learn what it means and how to assess your current level.',
      category: 'Data Strategy',
      date: 'Dec 15, 2024',
      icon: '📊',
      readTime: '5 min read'
    },
    {
      slug: 'five-pillars-data-governance',
      title: 'The Five Pillars of Effective Data Governance',
      excerpt: 'Discover the essential components of a robust data governance framework and how to implement them in your organization.',
      category: 'Data Governance',
      date: 'Dec 10, 2024',
      icon: '🛡️',
      readTime: '7 min read'
    },
    {
      slug: 'building-data-culture',
      title: 'Building a Data-Driven Culture: A Practical Guide',
      excerpt: 'Cultural change is often the biggest barrier to data transformation. Here are actionable steps to foster a data-driven mindset.',
      category: 'Leadership',
      date: 'Dec 5, 2024',
      icon: '🎯',
      readTime: '6 min read'
    },
    {
      slug: 'data-quality-best-practices',
      title: 'Data Quality Best Practices for 2025',
      excerpt: 'Poor data quality costs organizations millions. Learn the best practices to ensure your data is accurate, complete, and reliable.',
      category: 'Data Quality',
      date: 'Nov 28, 2024',
      icon: '✅',
      readTime: '8 min read'
    },
    {
      slug: 'ai-readiness-assessment',
      title: 'Is Your Organization Ready for AI? A Self-Assessment Guide',
      excerpt: 'Before jumping into AI initiatives, ensure your data foundation is solid. Use this guide to assess your AI readiness.',
      category: 'AI & ML',
      date: 'Nov 20, 2024',
      icon: '🤖',
      readTime: '6 min read'
    },
    {
      slug: 'data-literacy-importance',
      title: 'Why Data Literacy Should Be Your Top Priority in 2025',
      excerpt: 'Data literacy is becoming a critical skill for all employees. Learn why and how to build data literacy across your organization.',
      category: 'Training',
      date: 'Nov 15, 2024',
      icon: '🎓',
      readTime: '5 min read'
    }
  ];

  return (
    <div className="landing-page">
      <Navbar />

      {/* Page Header */}
      <header className="landing-page-header">
        <h1>Blog</h1>
        <p>Insights and best practices for data excellence</p>
      </header>

      {/* Blog Grid */}
      <section className="landing-section">
        <div className="landing-blog-grid">
          {posts.map((post, index) => (
            <article key={index} className="landing-blog-card">
              <div className="landing-blog-image">
                {post.icon}
              </div>
              <div className="landing-blog-content">
                <div className="landing-blog-meta">
                  <span className="landing-blog-category">{post.category}</span>
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <span className="landing-blog-read-more">Read More</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="landing-section landing-section-dark">
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--omnisight-primary)', marginBottom: '1rem' }}>
            Stay Updated
          </h2>
          <p style={{ color: 'var(--omnisight-text-light)', marginBottom: '2rem' }}>
            Subscribe to our newsletter for the latest insights on data management and analytics.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #eee',
                borderRadius: '8px',
                fontSize: '1rem',
                minWidth: '250px'
              }}
            />
            <button
              className="landing-btn landing-btn-primary"
              style={{ background: 'var(--omnisight-gradient)' }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section landing-contact">
        <h2>Ready to Assess Your Data Maturity?</h2>
        <p>
          Take our free assessment to understand where your organization stands.
        </p>
        <Link href="/dma" className="landing-btn landing-btn-primary">
          Start Assessment
        </Link>
      </section>

      <Footer />
    </div>
  );
}
