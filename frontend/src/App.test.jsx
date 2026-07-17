import { render, screen } from '@testing-library/react';
import App from './App';
import AuthProvider from './context/AuthContext';

test('renders the homepage nav without crashing', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  expect(screen.getAllByText(/JeevanHub|Jeevan/i).length).toBeGreaterThan(0);
});
