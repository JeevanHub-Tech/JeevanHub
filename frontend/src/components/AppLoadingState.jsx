import React from 'react';
import { Loader2 } from 'lucide-react';
import './AppLoadingState.css';

const AppLoadingState = () => (
	<div className="app-loading" role="status" aria-live="polite">
		<Loader2 className="app-loading__spinner" size={42} aria-hidden="true" />
		<span>Loading JeevanHub</span>
	</div>
);

export default AppLoadingState;
