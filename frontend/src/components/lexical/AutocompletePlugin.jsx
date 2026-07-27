import { useEffect, useState, useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	$getRoot,
	KEY_TAB_COMMAND,
	COMMAND_PRIORITY_LOW,
} from "lexical";

// Local (no-AI-call) inline autocomplete: suggests the rest of a sentence the
// doctor has already written in one of their own past blogs, ghost-text style.
// Corpus is built once from plain text of prior posts; matching is a plain
// case-insensitive prefix match against the current paragraph's text up to
// the caret, so it only ever suggests wording the doctor has used before.
function buildCorpus(pastTexts) {
	const sentences = new Set();
	for (const text of pastTexts || []) {
		const plain = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
		for (const raw of plain.split(/(?<=[.!?])\s+/)) {
			const sentence = raw.trim();
			if (sentence.length >= 12 && sentence.length <= 240) sentences.add(sentence);
		}
	}
	return Array.from(sentences);
}

function findSuggestion(corpus, currentText) {
	if (!currentText || currentText.length < 3) return null;
	const needle = currentText.toLowerCase();
	let best = null;
	for (const sentence of corpus) {
		const lower = sentence.toLowerCase();
		if (lower.startsWith(needle) && lower.length > needle.length) {
			if (!best || sentence.length < best.length) best = sentence;
		}
	}
	return best ? best.slice(currentText.length) : null;
}

export default function AutocompletePlugin({ corpusTexts }) {
	const [editor] = useLexicalComposerContext();
	const [ghost, setGhost] = useState(null); // { text, rect }
	const corpus = useMemo(() => buildCorpus(corpusTexts), [corpusTexts]);

	useEffect(() => {
		const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					setGhost(null);
					return;
				}
				const anchorNode = selection.anchor.getNode();
				const block = anchorNode.getTopLevelElementOrThrow();
				const precedingOffset = anchorNode.is(block) ? 0 : getPrecedingOffset(block, anchorNode);
				const offset = selection.anchor.offset + (precedingOffset ?? 0);
				const currentText = block.getTextContent().slice(0, offset);
				const suggestion = findSuggestion(corpus, currentText);

				if (!suggestion) {
					setGhost(null);
					return;
				}

				const domSelection = window.getSelection();
				const range = domSelection?.rangeCount ? domSelection.getRangeAt(0).cloneRange() : null;
				const rect = range?.getClientRects()?.[0] || range?.getBoundingClientRect();
				if (!rect || (rect.width === 0 && rect.height === 0)) {
					setGhost(null);
					return;
				}
				setGhost({ text: suggestion, rect });
			});
		});

		return removeUpdateListener;
	}, [editor, corpus]);

	useEffect(() => {
		return editor.registerCommand(
			KEY_TAB_COMMAND,
			(event) => {
				if (!ghost) return false;
				event.preventDefault();
				editor.update(() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						selection.insertText(ghost.text);
					}
				});
				setGhost(null);
				return true;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor, ghost]);

	if (!ghost) return null;

	return (
		<span
			className="pointer-events-none fixed z-50 whitespace-pre text-(--jh-muted)"
			style={{
				left: ghost.rect.right,
				top: ghost.rect.top,
				font: "inherit",
				lineHeight: `${ghost.rect.height}px`,
			}}
		>
			{ghost.text}
			<span className="ml-1 rounded border border-(--jh-line-strong) px-1 text-[10px] opacity-70">Tab</span>
		</span>
	);
}

// Sums the text length of every node preceding `targetNode` within `block`'s
// subtree, so a caret inside a nested inline node (e.g. text wrapped in a
// link) still gets the right absolute offset into the block's full text.
function getPrecedingOffset(block, targetNode) {
	let offset = 0;
	for (const child of block.getChildren()) {
		if (child.is(targetNode)) return offset;
		if (typeof child.getChildren === "function") {
			const found = child
				.getChildren()
				.some((grandchild) => grandchild.is(targetNode) || (typeof grandchild.getChildren === "function" && grandchild.getChildrenSize() > 0));
			if (found) return offset + getPrecedingOffset(child, targetNode);
		}
		offset += child.getTextContent().length;
	}
	return offset;
}
