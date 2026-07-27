import { createContext, useCallback, useContext, useRef, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PromptDialogContext = createContext(null);

// App-wide replacement for window.prompt()/window.confirm() — those render
// as an unstyled native browser dialog ("localhost:3000 says") that clashes
// with the rest of the themed UI. Mounted once at the app root (index.jsx)
// so any component, including plugins deep inside the Lexical editor tree,
// can call usePrompt()/useConfirm() and await the result like a real prompt.
export function PromptDialogProvider({ children }) {
	const [state, setState] = useState(null); // { mode: 'prompt' | 'confirm', title, description, placeholder, value, danger }
	const resolveRef = useRef(null);

	const close = useCallback((result) => {
		resolveRef.current?.(result);
		resolveRef.current = null;
		setState(null);
	}, []);

	const prompt = useCallback(({ title = "Enter a value", description, placeholder = "", defaultValue = "" } = {}) => {
		return new Promise((resolve) => {
			resolveRef.current = resolve;
			setState({ mode: "prompt", title, description, placeholder, value: defaultValue });
		});
	}, []);

	const confirm = useCallback(({ title = "Are you sure?", description, danger = false } = {}) => {
		return new Promise((resolve) => {
			resolveRef.current = resolve;
			setState({ mode: "confirm", title, description, danger });
		});
	}, []);

	const handleSubmit = () => {
		if (state?.mode === "prompt") close(state.value.trim() || null);
		else close(true);
	};

	const handleCancel = () => close(state?.mode === "prompt" ? null : false);

	return (
		<PromptDialogContext.Provider value={{ prompt, confirm }}>
			{children}
			<Dialog open={!!state} onOpenChange={(open) => !open && handleCancel()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{state?.title}</DialogTitle>
						{state?.description ? <DialogDescription>{state.description}</DialogDescription> : null}
					</DialogHeader>

					{state?.mode === "prompt" ? (
						<Input
							autoFocus
							value={state.value}
							placeholder={state.placeholder}
							onChange={(e) => setState((prev) => ({ ...prev, value: e.target.value }))}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSubmit();
							}}
						/>
					) : null}

					<DialogFooter>
						<Button variant="secondary" onClick={handleCancel}>
							Cancel
						</Button>
						<Button variant={state?.danger ? "destructive" : "default"} onClick={handleSubmit}>
							{state?.mode === "confirm" ? "Confirm" : "OK"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PromptDialogContext.Provider>
	);
}

export function usePrompt() {
	const ctx = useContext(PromptDialogContext);
	if (!ctx) throw new Error("usePrompt must be used within PromptDialogProvider");
	return ctx.prompt;
}

export function useConfirm() {
	const ctx = useContext(PromptDialogContext);
	if (!ctx) throw new Error("useConfirm must be used within PromptDialogProvider");
	return ctx.confirm;
}
