import React from 'react';
import './RoutePageShell.css';

const RoutePageShell = ({ children }) => (
	<div className="route-page-shell" data-testid="route-page-shell">
		{children}
	</div>
);

export default RoutePageShell;
