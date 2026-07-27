import { $getSelection, $isRangeSelection, $insertNodes, $getRoot, $createParagraphNode } from "lexical";

// Inserts a block-level node (image/embed) and drops the caret into a fresh
// empty paragraph right after it — without this, the doctor gets stuck with
// no text field to type into once an image/embed sits at the end of the doc.
// Must be called from inside editor.update().
export function $insertBlockAndFocusNext(node) {
	const selection = $getSelection();
	if ($isRangeSelection(selection)) {
		$insertNodes([node]);
	} else {
		$getRoot().append(node);
	}
	const paragraph = $createParagraphNode();
	node.insertAfter(paragraph);
	paragraph.select();
}
