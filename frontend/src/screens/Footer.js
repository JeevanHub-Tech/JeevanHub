import React from 'react';
import './Footer.css'; // Import your CSS for styling
import logo from '../media/logo.png';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section footer-brand">
          <div className="footer-brand-row">
            <img src={logo} alt="JeevanHub" className="footer-logo" />
            <span className="footer-brand-name">JeevanHub</span>
          </div>
          <p>Authentic Ayurvedic care — connecting you with certified doctors, natural remedies, and holistic wellness guidance.</p>
        </div>
        <div className="footer-section">
          <h4>About Us</h4>
          <p>Learn more about our mission and values.</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/treatments">Treatments</a></li>
            <li><a href="/doctors">Doctors</a></li>
            <li><a href="/medicines">Medicines</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>Email: support@ayurvedic.com</p>
          <p>Phone: 8688324518</p>
        </div>
        <div className="footer-section">
          <h4>Follow Us</h4>
          <ul className="social-links">
            <li><a href="https://facebook.com">Facebook</a></li>
            <li><a href="https://twitter.com">Twitter</a></li>
            <li><a href="https://instagram.com">Instagram</a></li>
            <li><a href="https://linkedin.com">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Ayurvedic Consultations. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
