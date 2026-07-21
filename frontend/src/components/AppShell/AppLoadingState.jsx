import { Loader2 } from 'lucide-react';

const AppLoadingState = () => (
	<div
		className="grid min-h-[calc(100vh-116px)] place-items-center content-center gap-3.5 bg-(--jh-cream) p-8 px-5 font-body text-base font-semibold text-(--jh-olive-deep)"
		role="status"
		aria-live="polite"
	>
		<Loader2 className="animate-spin text-(--jh-olive-leaf) motion-reduce:animate-none" size={42} aria-hidden="true" />
		<span>Loading JeevanHub</span>
	</div>
);

export default AppLoadingState;
