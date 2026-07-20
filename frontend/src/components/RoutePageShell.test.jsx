import { render, screen } from '@testing-library/react';
import RoutePageShell from './RoutePageShell';

test('keeps routed content in a full-height page shell', () => {
	render(
		<RoutePageShell>
			<div>Page content</div>
		</RoutePageShell>
	);

	const shell = screen.getByTestId('route-page-shell');
	expect(shell).toHaveClass('route-page-shell');
	expect(shell).toContainElement(screen.getByText('Page content'));
});
