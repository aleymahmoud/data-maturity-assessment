'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
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
        <li>
          <Link
            href="/services"
            className={isActive('/services') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Services
          </Link>
        </li>
        <li>
          <Link
            href="/tools"
            className={isActive('/tools') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Tools
          </Link>
        </li>
        <li>
          <Link
            href="/about"
            className={isActive('/about') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </Link>
        </li>
        <li>
          <Link
            href="/blog"
            className={isActive('/blog') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Blog
          </Link>
        </li>
        <li>
          <Link
            href="/contact"
            className={isActive('/contact') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
        </li>
        <li>
          <Link href="/dma" className="landing-nav-cta" onClick={() => setMobileMenuOpen(false)}>
            Get Started
          </Link>
        </li>
      </ul>
    </nav>
  );
}
