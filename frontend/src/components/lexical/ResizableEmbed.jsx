import { useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey } from "lexical";

import { cn } from "@/lib/utils";

// Wraps an embed (image/YouTube/Twitter) in a native-CSS-resize box — drag
// the bottom-right corner to resize, same gesture as Notion's embed resize.
// No JS drag tracking needed; we just read the final size on mouseup and
// persist it onto the owning Lexical node via `setWidth`.
export default function ResizableEmbed({ nodeKey, width, defaultWidth = "100%", className, children }) {
	const [editor] = useLexicalComposerContext();
	const ref = useRef(null);

	const handleMouseUp = () => {
		if (!ref.current) return;
		const newWidth = Math.round(ref.current.getBoundingClientRect().width);
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (node && typeof node.setWidth === "function") node.setWidth(newWidth);
		});
	};

	return (
		<div
			ref={ref}
			contentEditable={false}
			onMouseUp={handleMouseUp}
			className={cn("max-w-full resize-x overflow-hidden", className)}
			style={{ width: width ? `${width}px` : defaultWidth }}
		>
			{children}
		</div>
	);
}
