import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import App from './App';
import AuthProvider from './context/AuthContext';
import { PromptDialogProvider } from './context/PromptDialogContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <PromptDialogProvider>
            <App />
          </PromptDialogProvider>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
