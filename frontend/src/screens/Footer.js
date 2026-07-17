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
          <p>Email: jeevanhub0@gmail.com</p>
          <p>Phone: 8688324518</p>
        </div>
        <div className="footer-section">
          <h4>Follow Us</h4>
          <ul className="social-links">
            <li><a href="https://www.facebook.com/profile.php?id=61590780691533&sk=photos" target="_blank" rel="noopener noreferrer">Facebook</a></li>
            <li><a href="https://x.com/jeevanhub_" target="_blank" rel="noopener noreferrer">Twitter</a></li>
            <li><a href="https://www.instagram.com/jeevanhub_ayurveda/?hl=en" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="https://www.linkedin.com/in/jeevanhub-undefined-9b9128417/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} JeevanHub. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
