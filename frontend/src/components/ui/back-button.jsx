import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Consistent top-of-page back navigation. Defaults to browser back
// (navigate(-1)); pass `to` for a fixed destination when a screen can be
// deep-linked to directly and history may not have a sensible entry.
function BackButton({ to, label = "Back", className }) {
	const navigate = useNavigate();
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={() => (to ? navigate(to) : navigate(-1))}
			className={cn("-ml-2 gap-1.5 text-muted-foreground hover:text-foreground", className)}
		>
			<ArrowLeft className="size-4" aria-hidden="true" />
			{label}
		</Button>
	);
}

export { BackButton };
