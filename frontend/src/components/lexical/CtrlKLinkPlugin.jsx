import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, KEY_DOWN_COMMAND, COMMAND_PRIORITY_HIGH } from "lexical";
import { $toggleLink } from "@lexical/link";

import { usePrompt } from "@/context/PromptDialogContext";

// Word/Notion-style Ctrl+K (Cmd+K on Mac): if text is selected, that text
// becomes the link's visible title and just gets wrapped in a link. If
// nothing is selected, the URL itself is inserted as the link text.
export default function CtrlKLinkPlugin() {
	const [editor] = useLexicalComposerContext();
	const prompt = usePrompt();

	useEffect(() => {
		return editor.registerCommand(
			KEY_DOWN_COMMAND,
			(event) => {
				const isModK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
				if (!isModK) return false;
				event.preventDefault();

				prompt({ title: "Add link", placeholder: "https://example.com" }).then((url) => {
					if (!url) return;
					let fullUrl = url.trim();
					if (!/^(https?:\/\/|mailto:|tel:)/.test(fullUrl)) fullUrl = `https://${fullUrl}`;

					editor.update(() => {
						let selection = $getSelection();
						if (!$isRangeSelection(selection)) return;

						if (selection.isCollapsed()) {
							selection.insertText(fullUrl);
							selection = $getSelection();
							if ($isRangeSelection(selection)) {
								const focusNode = selection.focus.getNode();
								const focusOffset = selection.focus.offset;
								selection.anchor.set(focusNode.getKey(), focusOffset - fullUrl.length, "text");
							}
						}

						// $toggleLink reads the current selection itself; it doesn't take one as an argument.
						$toggleLink(fullUrl);
					});
				});

				return true;
			},
			COMMAND_PRIORITY_HIGH
		);
	}, [editor, prompt]);

	return null;
}
