import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";

import { $isImageNode } from "@/components/lexical/ImageNode";
import { useImageUpload } from "@/components/lexical/ImageUploadContext";

function collectImageSrcs(root) {
	const srcs = new Set();
	const walk = (node) => {
		if ($isImageNode(node)) srcs.add(node.getSrc());
		if (typeof node.getChildren === "function") {
			for (const child of node.getChildren()) walk(child);
		}
	};
	walk(root);
	return srcs;
}

// Watches the document for images that get removed (deleted by the doctor,
// undone via backspace, etc.) and deletes the matching Cloudinary asset —
// but only for images this editor session itself uploaded (tracked in the
// shared registry), never arbitrary <img src> that came in via pasted HTML.
export default function ImageLifecyclePlugin() {
	const [editor] = useLexicalComposerContext();
	const { registry, deleteImages } = useImageUpload();
	const previousSrcsRef = useRef(null);

	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				const currentSrcs = collectImageSrcs($getRoot());
				const previousSrcs = previousSrcsRef.current;
				previousSrcsRef.current = currentSrcs;
				if (!previousSrcs) return;

				const removedPublicIds = [];
				for (const src of previousSrcs) {
					if (currentSrcs.has(src)) continue;
					const publicId = registry.current.get(src);
					if (publicId) {
						removedPublicIds.push(publicId);
						registry.current.delete(src);
					}
				}
				if (removedPublicIds.length > 0) deleteImages(removedPublicIds);
			});
		});
	}, [editor, registry, deleteImages]);

	return null;
}
