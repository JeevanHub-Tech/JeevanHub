const RoutePageShell = ({ children }) => (
	<div className="mt-33.25 box-border flex min-h-[calc(100vh-133px)] flex-col pt-8 *:grow *:shrink-0 *:basis-auto" data-testid="route-page-shell">
		{children}
	</div>
);

export default RoutePageShell;
