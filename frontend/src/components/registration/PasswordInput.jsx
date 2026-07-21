import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";

// Single source of truth for the show/hide password field used across all
// three registration forms (previously copy-pasted in each screen).
function PasswordInput({ value, onChange, onBlur, placeholder, name, hasError }) {
	const [show, setShow] = useState(false);
	return (
		<div className="relative">
			<Input
				type={show ? "text" : "password"}
				name={name}
				value={value}
				onChange={onChange}
				onBlur={onBlur}
				placeholder={placeholder}
				aria-invalid={hasError}
				autoComplete="new-password"
				className="pr-10"
			/>
			<button
				type="button"
				tabIndex={-1}
				onClick={() => setShow((s) => !s)}
				aria-label={show ? "Hide password" : "Show password"}
				className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center text-muted-foreground hover:text-primary"
			>
				{show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
			</button>
		</div>
	);
}

export default PasswordInput;
