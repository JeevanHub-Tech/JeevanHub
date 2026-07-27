import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import App from './App';
import AuthProvider from './context/AuthContext';
import { PromptDialogProvider } from './context/PromptDialogContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <PromptDialogProvider>
        <App />
      </PromptDialogProvider>
    </AuthProvider>
  </React.StrictMode>
);
