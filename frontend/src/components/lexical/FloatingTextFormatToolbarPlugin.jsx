import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from "lexical";
import { $toggleLink } from "@lexical/link";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter, Link as LinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePrompt } from "@/context/PromptDialogContext";

const buttonClass = (isActive) =>
	cn(
		"cursor-pointer rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
		isActive && "bg-secondary text-foreground"
	);

// Notion/Medium-style floating toolbar that appears above a text selection —
// a quick path to inline formatting without reaching for the fixed toolbar.
export default function FloatingTextFormatToolbarPlugin() {
	const [editor] = useLexicalComposerContext();
	const prompt = usePrompt();
	const [state, setState] = useState(null); // { rect, bold, italic, underline, strikethrough, highlight }

	useEffect(() => {
		const updateToolbar = () => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection) || selection.isCollapsed() || selection.getTextContent().trim() === "") {
				setState(null);
				return;
			}

			const domSelection = window.getSelection();
			const range = domSelection?.rangeCount ? domSelection.getRangeAt(0) : null;
			const rect = range?.getBoundingClientRect();
			if (!rect || (rect.width === 0 && rect.height === 0)) {
				setState(null);
				return;
			}

			setState({
				rect,
				bold: selection.hasFormat("bold"),
				italic: selection.hasFormat("italic"),
				underline: selection.hasFormat("underline"),
				strikethrough: selection.hasFormat("strikethrough"),
				highlight: selection.hasFormat("highlight"),
			});
		};

		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				updateToolbar();
				return false;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor]);

	const handleLink = async () => {
		const url = await prompt({ title: "Add link", placeholder: "https://example.com" });
		if (!url) return;
		let fullUrl = url.trim();
		if (!/^(https?:\/\/|mailto:|tel:)/.test(fullUrl)) fullUrl = `https://${fullUrl}`;
		editor.update(() => $toggleLink(fullUrl));
	};

	if (!state) return null;

	return createPortal(
		<div
			className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-lg border border-border bg-card p-1 shadow-lg"
			style={{ left: state.rect.left + state.rect.width / 2, top: state.rect.top - 8 }}
			// Selection collapses on mousedown into the toolbar unless we stop it.
			onMouseDown={(e) => e.preventDefault()}
		>
			<button className={buttonClass(state.bold)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
				<Bold size={16} />
			</button>
			<button className={buttonClass(state.italic)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
				<Italic size={16} />
			</button>
			<button className={buttonClass(state.underline)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>
				<UnderlineIcon size={16} />
			</button>
			<button
				className={buttonClass(state.strikethrough)}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
			>
				<Strikethrough size={16} />
			</button>
			<button className={buttonClass(state.highlight)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "highlight")}>
				<Highlighter size={16} />
			</button>
			<button className={buttonClass(false)} onClick={handleLink}>
				<LinkIcon size={16} />
			</button>
		</div>,
		document.body
	);
}
