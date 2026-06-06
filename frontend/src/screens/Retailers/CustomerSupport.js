import React from 'react';
import './CustomerSupport.css';

function CustomerSupport() {
  return (
    <div className="support-container">
      <div className="support-icon-wrapper">
        <svg className="support-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 2.45.89 4.69 2.36 6.41l-1.12 3.36 3.36-1.12C8.31 21.11 10.55 22 12 22c5.52 22 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 10.9 12 11.5 12 13h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
        </svg>
      </div>
      <h1 className="support-title">Customer Support</h1>
      <p className="support-message">
        We are building a dedicated support center to assist you with your queries and concerns. 
        Our team is working hard to bring this feature to you very soon!
      </p>
      <div className="support-badge">Coming Soon</div>
    </div>
  );
}

export default CustomerSupport;
