import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $getSelection, $isRangeSelection } from "lexical";

const PLACEHOLDER_TEXT = "Press ‘/’ for commands, or drag an image in";

// Shows the "press / for commands" hint only on the currently focused empty
// line (not every empty line — Notion-ish, but scoped to the caret so an
// empty draft doesn't read as several duplicate hint lines stacked up).
// CSS `:empty` can't be used here — Lexical keeps a <br> inside empty
// paragraphs for caret positioning, so the element is never truly :empty —
// so this tags the focused empty block with a data attribute and a CSS
// ::before (defined in LexicalEditor.jsx's <style> block) renders the hint.
export default function EmptyBlockPlaceholderPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const updatePlaceholder = () => {
			editor.getEditorState().read(() => {
				const selection = $getSelection();
				const root = $getRoot();
				let focusedKey =
					$isRangeSelection(selection) && selection.isCollapsed()
						? selection.anchor.getNode().getTopLevelElementOrThrow().getKey()
						: null;

				// Nothing focused yet (editor hasn't been clicked into): fall back to
				// the very first block if the whole document is still empty, so a
				// brand-new blog isn't a blank page with no hint at all.
				if (focusedKey === null && root.getChildrenSize() === 1 && root.getFirstChild().getTextContent() === "") {
					focusedKey = root.getFirstChild().getKey();
				}

				for (const child of root.getChildren()) {
					const el = editor.getElementByKey(child.getKey());
					if (!el) continue;
					const isEmpty = typeof child.getTextContent === "function" && child.getTextContent() === "";
					if (isEmpty && child.getKey() === focusedKey) {
						el.setAttribute("data-empty-placeholder", PLACEHOLDER_TEXT);
					} else {
						el.removeAttribute("data-empty-placeholder");
					}
				}
			});
		};

		updatePlaceholder();
		return editor.registerUpdateListener(updatePlaceholder);
	}, [editor]);

	return null;
}
