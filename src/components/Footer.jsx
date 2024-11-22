import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <h3>Unlock Your Business's Potential with</h3>
          <h4>Our Social Media Solutions</h4>
          <nav className="footer-links">
            <a href="/overview">Overview</a>
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/careers">Careers</a>
            <a href="/help">Help</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </div>
        <div className="footer-right">
          <h3>Stay Up-to-Date with the Latest Social Media</h3>
          <h4>Strategies and Insights</h4>
          <div className="subscribe">
            <input type="email" placeholder="Your Email" />
            <button>Subscribe</button>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 Printz. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
