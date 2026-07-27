import { createPortal } from "react-dom";
import { $getNodeByKey, $isRangeSelection, $copyNode, $createParagraphNode } from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $insertList } from "@lexical/list";
import { Type, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Copy, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

const TURN_INTO_OPTIONS = [
	{ label: "Text", icon: Type, apply: () => $createParagraphNode() },
	{ label: "Heading 1", icon: Heading1, apply: () => $createHeadingNode("h1") },
	{ label: "Heading 2", icon: Heading2, apply: () => $createHeadingNode("h2") },
	{ label: "Heading 3", icon: Heading3, apply: () => $createHeadingNode("h3") },
	{ label: "Quote", icon: Quote, apply: () => $createQuoteNode() },
];

const menuItemClass =
	"flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm text-foreground hover:bg-accent";

// The dropdown that opens when the drag-handle grip is *clicked* (as opposed
// to held-and-dragged, which is handled by DraggableBlockPlugin_EXPERIMENTAL
// itself). Mirrors Notion's block context menu: turn into / duplicate /
// move / delete.
export default function BlockActionsMenu({ editor, targetKey, rect, onClose }) {
	if (!rect) return null;

	const withNode = (fn) => {
		editor.update(() => {
			const node = $getNodeByKey(targetKey);
			if (node) fn(node);
		});
		onClose();
	};

	const turnInto = (apply) =>
		withNode((node) => {
			const selection = node.select(0, node.getChildrenSize ? node.getChildrenSize() : 0);
			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, apply);
			}
		});

	const turnIntoList = (listType) =>
		withNode((node) => {
			const selection = node.select(0, node.getChildrenSize ? node.getChildrenSize() : 0);
			if ($isRangeSelection(selection)) {
				$insertList(listType);
			}
		});

	const duplicate = () =>
		withNode((node) => {
			const clone = $copyNode(node);
			node.insertAfter(clone);
		});

	const moveUp = () =>
		withNode((node) => {
			const prev = node.getPreviousSibling();
			if (prev) prev.insertBefore(node);
		});

	const moveDown = () =>
		withNode((node) => {
			const next = node.getNextSibling();
			if (next) next.insertAfter(node);
		});

	const deleteBlock = () => withNode((node) => node.remove());

	return createPortal(
		<>
			<div className="fixed inset-0 z-40" onClick={onClose} />
			<div
				className="fixed z-50 w-56 overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-lg"
				style={{ left: rect.left, top: rect.bottom + 4 }}
			>
				<p className="px-2.5 pt-1 pb-1.5 text-xs font-semibold text-muted-foreground">Turn into</p>
				{TURN_INTO_OPTIONS.map((option) => (
					<button key={option.label} type="button" className={menuItemClass} onClick={() => turnInto(option.apply)}>
						<option.icon size={16} className="text-muted-foreground" />
						{option.label}
					</button>
				))}
				<button type="button" className={menuItemClass} onClick={() => turnIntoList("bullet")}>
					<List size={16} className="text-muted-foreground" />
					Bulleted list
				</button>
				<button type="button" className={menuItemClass} onClick={() => turnIntoList("number")}>
					<ListOrdered size={16} className="text-muted-foreground" />
					Numbered list
				</button>

				<div className="my-1.5 border-t border-border" />

				<button type="button" className={menuItemClass} onClick={duplicate}>
					<Copy size={16} className="text-muted-foreground" />
					Duplicate
				</button>
				<button type="button" className={menuItemClass} onClick={moveUp}>
					<ArrowUp size={16} className="text-muted-foreground" />
					Move up
				</button>
				<button type="button" className={menuItemClass} onClick={moveDown}>
					<ArrowDown size={16} className="text-muted-foreground" />
					Move down
				</button>
				<button type="button" className={menuItemClass + " text-destructive hover:bg-destructive/10"} onClick={deleteBlock}>
					<Trash2 size={16} />
					Delete
				</button>
			</div>
		</>,
		document.body
	);
}
