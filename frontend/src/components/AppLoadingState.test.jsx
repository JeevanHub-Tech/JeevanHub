import { render, screen } from '@testing-library/react';
import AppLoadingState from './AppLoadingState';

test('renders a centered loading message for lazy route transitions', () => {
	render(<AppLoadingState />);

	expect(screen.getByRole('status')).toHaveTextContent('Loading JeevanHub');
});
