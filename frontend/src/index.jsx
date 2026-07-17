import React from 'react';
import ReactDOM from 'react-dom/client';
import './output.css'; // Make sure it's output.css, not index.css
import './tokens.css'; // design tokens + global focus/reduced-motion

import App from './App';
import AuthProvider from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
