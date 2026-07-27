import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $getNodeByKey, $createParagraphNode } from "lexical";
import { GripVertical, Plus } from "lucide-react";

import BlockActionsMenu from "@/components/lexical/BlockActionsMenu";

const DRAG_THRESHOLD = 4;

// Hand-rolled Notion-style block gutter: hover a block to reveal "+"/grip
// icons, click "+" to insert a new block and open the slash-command menu in
// it, click the grip to open the block-actions menu, or hold-and-drag the
// grip to reorder blocks.
//
// This intentionally does NOT use @lexical/react's
// DraggableBlockPlugin_EXPERIMENTAL. That plugin wraps its handle in a native
// `<div draggable>`, and a plain click on a descendant of a draggable
// ancestor is unreliable across browsers — clicks on the handle kept
// silently doing nothing. Everything here is plain mouse events under our
// own control instead, so click vs. drag is a simple movement-threshold
// check, not something fighting native HTML5 drag-and-drop semantics.
export default function DraggableBlockPluginWrapper({ anchorElem }) {
	const [editor] = useLexicalComposerContext();
	const [hovered, setHovered] = useState(null); // { key, top, height }
	const [dropIndicatorTop, setDropIndicatorTop] = useState(null);
	const [actionsMenu, setActionsMenu] = useState(null); // { rect, targetKey }
	const hoveredRef = useRef(null);
	const gripButtonRef = useRef(null);

	const getTopLevelBlocks = useCallback(() => {
		if (!anchorElem) return [];
		const anchorRect = anchorElem.getBoundingClientRect();
		const blocks = [];
		editor.getEditorState().read(() => {
			for (const child of $getRoot().getChildren()) {
				const el = editor.getElementByKey(child.getKey());
				if (!el) continue;
				const rect = el.getBoundingClientRect();
				blocks.push({
					key: child.getKey(),
					top: rect.top - anchorRect.top,
					bottom: rect.bottom - anchorRect.top,
					height: rect.height,
				});
			}
		});
		return blocks;
	}, [editor, anchorElem]);

	useEffect(() => {
		if (!anchorElem) return;

		const handleMouseMove = (event) => {
			const anchorRect = anchorElem.getBoundingClientRect();
			const y = event.clientY - anchorRect.top;
			const match = getTopLevelBlocks().find((b) => y >= b.top && y <= b.bottom) || null;
			hoveredRef.current = match;
			setHovered(match);
		};
		const handleMouseLeave = () => {
			hoveredRef.current = null;
			setHovered(null);
		};

		anchorElem.addEventListener("mousemove", handleMouseMove);
		anchorElem.addEventListener("mouseleave", handleMouseLeave);
		return () => {
			anchorElem.removeEventListener("mousemove", handleMouseMove);
			anchorElem.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [anchorElem, getTopLevelBlocks]);

	const handleAddClick = () => {
		const key = hoveredRef.current?.key;
		if (!key) return;
		editor.update(() => {
			const node = $getNodeByKey(key);
			if (!node) return;
			// If the hovered block is already empty, open the command menu right
			// there instead of stacking an extra blank line under it.
			const target = node.getTextContent() === "" ? node : (() => {
				const paragraph = $createParagraphNode();
				node.insertAfter(paragraph);
				return paragraph;
			})();
			const selection = target.select();
			selection.insertText("/");
		});
	};

	const handleGripMouseDown = (downEvent) => {
		const dragKey = hoveredRef.current?.key;
		if (!dragKey || !anchorElem) return;
		const startY = downEvent.clientY;
		let dragging = false;

		const handleMouseMove = (moveEvent) => {
			if (!dragging && Math.abs(moveEvent.clientY - startY) > DRAG_THRESHOLD) {
				dragging = true;
			}
			if (!dragging) return;

			const blocks = getTopLevelBlocks();
			const anchorRect = anchorElem.getBoundingClientRect();
			const y = moveEvent.clientY - anchorRect.top;
			let indicatorTop = blocks.length ? blocks[0].top : 0;
			for (const b of blocks) {
				if (y >= (b.top + b.bottom) / 2) indicatorTop = b.bottom;
			}
			setDropIndicatorTop(indicatorTop);
		};

		const handleMouseUp = (upEvent) => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
			setDropIndicatorTop(null);

			if (!dragging) {
				// No real movement — this was a click, not a drag: open the menu.
				const rect = gripButtonRef.current?.getBoundingClientRect();
				if (rect) setActionsMenu({ rect, targetKey: dragKey });
				return;
			}

			const blocks = getTopLevelBlocks();
			const anchorRect = anchorElem.getBoundingClientRect();
			const y = upEvent.clientY - anchorRect.top;
			let targetKey = null;
			let placeAfter = false;
			for (const b of blocks) {
				if (b.key === dragKey) continue;
				const mid = (b.top + b.bottom) / 2;
				targetKey = b.key;
				placeAfter = y >= mid;
				if (y < mid) break;
			}
			if (!targetKey || targetKey === dragKey) return;

			editor.update(() => {
				const dragNode = $getNodeByKey(dragKey);
				const targetNode = $getNodeByKey(targetKey);
				if (!dragNode || !targetNode) return;
				if (placeAfter) targetNode.insertAfter(dragNode);
				else targetNode.insertBefore(dragNode);
			});
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
	};

	if (!anchorElem) return null;

	return (
		<>
			{hovered && dropIndicatorTop === null ? (
				<div
					className="absolute left-0 flex items-center gap-0.5"
					style={{ top: hovered.top + Math.max(0, (hovered.height - 24) / 2) }}
				>
					<button
						type="button"
						draggable={false}
						onClick={handleAddClick}
						className="flex h-6 w-5 cursor-pointer items-center justify-center rounded text-(--jh-muted) hover:bg-(--jh-line)"
						title="Add block below"
					>
						<Plus size={16} />
					</button>
					<button
						ref={gripButtonRef}
						type="button"
						onMouseDown={handleGripMouseDown}
						className="flex h-6 w-5 cursor-grab items-center justify-center rounded text-(--jh-muted) hover:bg-(--jh-line) active:cursor-grabbing"
						title="Drag to move, click for more actions"
					>
						<GripVertical size={16} />
					</button>
				</div>
			) : null}

			{dropIndicatorTop !== null ? (
				<div
					className="pointer-events-none absolute right-0 left-0 h-0.5 rounded bg-(--jh-olive-leaf)"
					style={{ top: dropIndicatorTop }}
				/>
			) : null}

			{actionsMenu ? (
				<BlockActionsMenu
					editor={editor}
					targetKey={actionsMenu.targetKey}
					rect={actionsMenu.rect}
					onClose={() => setActionsMenu(null)}
				/>
			) : null}
		</>
	);
}
