import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="auth-footer">
      <div className="footer-content">
        <div className="footer-copyright">© 2025 Gransolve Infotech. All rights reserved.</div>
        <div className="social-icons">
          <a href="#" className="social-link" aria-label="Facebook">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className="social-link" aria-label="Twitter">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" className="social-link" aria-label="Google">
            <i className="fab fa-google"></i>
          </a>
          <a href="#" className="social-link" aria-label="LinkedIn">
            <i className="fab fa-linkedin-in"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 