import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $createImageNode } from "@/components/lexical/ImageNode";
import { useImageUpload } from "@/components/lexical/ImageUploadContext";
import { $insertBlockAndFocusNext } from "@/components/lexical/insertBlockAndFocusNext";

// Dropping an image file straight onto the editor uploads it to Cloudinary
// and inserts it inline — no toolbar round-trip needed, matching the
// Notion-style "drag an image in" workflow.
export default function ImageDragDropPlugin() {
	const [editor] = useLexicalComposerContext();
	const { uploadImage, registerUpload } = useImageUpload();

	useEffect(() => {
		return editor.registerRootListener((rootElement, prevRootElement) => {
			if (prevRootElement) {
				prevRootElement.removeEventListener("dragover", handleDragOver);
				prevRootElement.removeEventListener("drop", handleDrop);
			}
			if (rootElement) {
				rootElement.addEventListener("dragover", handleDragOver);
				rootElement.addEventListener("drop", handleDrop);
			}
		});

		function handleDragOver(event) {
			if (event.dataTransfer?.types?.includes("Files")) {
				event.preventDefault();
			}
		}

		async function handleDrop(event) {
			const files = Array.from(event.dataTransfer?.files || []).filter((f) => f.type.startsWith("image/"));
			if (files.length === 0) return;
			event.preventDefault();

			for (const file of files) {
				const result = await uploadImage(file);
				if (!result) continue;
				const { url, publicId } = result;
				registerUpload(url, publicId);

				editor.update(() => {
					$insertBlockAndFocusNext($createImageNode(url, file.name, publicId));
				});
			}
		}
	}, [editor, uploadImage, registerUpload]);

	return null;
}
