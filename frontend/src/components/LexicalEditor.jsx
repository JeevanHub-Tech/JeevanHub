import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { TRANSFORMERS, CODE } from "@lexical/markdown";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $getRoot } from "lexical";
import axios from "axios";

import { cn } from "@/lib/utils";
import { BACKEND_URL } from "@/config";
import { ImageNode } from "@/components/lexical/ImageNode";
import { YouTubeNode } from "@/components/lexical/YouTubeNode";
import { TwitterNode } from "@/components/lexical/TwitterNode";
import AutocompletePlugin from "@/components/lexical/AutocompletePlugin";
import CtrlKLinkPlugin from "@/components/lexical/CtrlKLinkPlugin";
import DraggableBlockPluginWrapper from "@/components/lexical/DraggableBlockPluginWrapper";
import ImageDragDropPlugin from "@/components/lexical/ImageDragDropPlugin";
import ImageLifecyclePlugin from "@/components/lexical/ImageLifecyclePlugin";
import { ImageUploadContext } from "@/components/lexical/ImageUploadContext";
import SlashCommandPlugin from "@/components/lexical/SlashCommandPlugin";
import EmptyBlockPlaceholderPlugin from "@/components/lexical/EmptyBlockPlaceholderPlugin";
import FloatingTextFormatToolbarPlugin from "@/components/lexical/FloatingTextFormatToolbarPlugin";

// Every markdown shortcut except the code-block one — we don't register a
// CodeNode, so leaving CODE in would crash the first time someone types ```.
const MARKDOWN_TRANSFORMERS = TRANSFORMERS.filter((transformer) => transformer !== CODE);

function EditorHandlePlugin({ editorRef }) {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		editorRef.current = editor;
	}, [editor, editorRef]);
	return null;
}

function InitialContentPlugin({ content }) {
	const [editor] = useLexicalComposerContext();
	const loadedRef = useRef(false);

	useEffect(() => {
		if (loadedRef.current) return;
		loadedRef.current = true;
		if (!content) return;
		editor.update(() => {
			const parser = new DOMParser();
			const dom = parser.parseFromString(content, "text/html");
			const nodes = $generateNodesFromDOM(editor, dom);
			const root = $getRoot();
			root.clear();
			root.append(...nodes);
		});
	}, [editor, content]);

	return null;
}

const editorTheme = {
	heading: {
		h1: "text-2xl font-semibold my-heading",
		h2: "text-xl font-semibold my-heading",
		h3: "text-lg font-semibold my-heading",
		h4: "text-base font-semibold my-heading",
		h5: "text-sm font-semibold my-heading",
		h6: "text-sm font-semibold my-heading",
	},
	list: {
		ul: "list-disc pl-5 my-2",
		ol: "list-decimal pl-5 my-2",
	},
	quote: "border-l-4 border-border pl-4 italic text-muted-foreground my-3",
	link: "text-(--jh-olive-leaf) underline cursor-pointer",
	text: {
		bold: "font-semibold",
		italic: "italic",
		underline: "underline",
		strikethrough: "line-through",
		highlight: "bg-(--jh-turmeric-gold) text-(--jh-ink)",
	},
	paragraph: "my-2",
};

// Notion-style clean-slate editor: no persistent toolbar. Formatting lives
// behind "/" (or the "+" gutter button, which opens the same menu) for
// blocks, and a floating toolbar appears when text is selected for inline
// formatting (bold/italic/link/etc).
const RichTextEditor = forwardRef(({ content, onChange, corpusTexts, fullPage = false }, ref) => {
	const registryRef = useRef(new Map());
	const editorInstanceRef = useRef(null);

	useImperativeHandle(ref, () => ({
		focus: () => editorInstanceRef.current?.focus(undefined, { defaultSelection: "rootStart" }),
	}));

	const initialConfig = {
		namespace: "jh-blog-editor",
		theme: editorTheme,
		nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, ImageNode, YouTubeNode, TwitterNode],
		onError(error) {
			console.error("Lexical error:", error);
		},
	};

	const uploadImage = useCallback(async (file) => {
		try {
			const formData = new FormData();
			formData.append("image", file);
			const token = localStorage.getItem("token");
			const res = await axios.post(`${BACKEND_URL}/api/blogs/upload-image`, formData, {
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
			});
			return { url: res.data.url, publicId: res.data.publicId };
		} catch (error) {
			console.error("Error uploading image:", error);
			window.alert("Failed to upload image.");
			return null;
		}
	}, []);

	const registerUpload = useCallback((url, publicId) => {
		if (publicId) registryRef.current.set(url, publicId);
	}, []);

	const deleteImages = useCallback(async (publicIds) => {
		try {
			const token = localStorage.getItem("token");
			await axios.post(
				`${BACKEND_URL}/api/blogs/delete-images`,
				{ publicIds },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
		} catch (error) {
			console.error("Error deleting removed blog images:", error);
		}
	}, []);

	const imageContextValue = useMemo(
		() => ({ uploadImage, registerUpload, deleteImages, registry: registryRef }),
		[uploadImage, registerUpload, deleteImages]
	);

	const handleChange = useCallback(
		(editorState, editor) => {
			editorState.read(() => {
				const html = $generateHtmlFromNodes(editor, null);
				onChange(html);
			});
		},
		[onChange]
	);

	const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
	const onEditorWrapperRef = useCallback((elem) => {
		if (elem !== null) setFloatingAnchorElem(elem);
	}, []);

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<ImageUploadContext.Provider value={imageContextValue}>
				<div className="w-full self-center bg-transparent">
					<style>{`
                        .rte-editor {
                            font-family: var(--jh-font-body);
                            color: var(--jh-ink);
                        }
                        .rte-editor .my-heading {
                            color: var(--jh-ink);
                            margin: 0.6em 0 0.3em;
                        }
                        .rte-editor a {
                            color: var(--jh-olive-leaf);
                            text-decoration: underline;
                            cursor: pointer;
                        }
                        .rte-editor .iframe-container {
                            position: relative;
                            width: 100%;
                            aspect-ratio: 16 / 9;
                        }
                        .rte-editor .iframe-container iframe {
                            width: 100%;
                            height: 100%;
                            border-radius: 0.5rem;
                        }
                        .rte-editor [data-empty-placeholder]::before {
                            content: attr(data-empty-placeholder);
                            float: left;
                            width: 0;
                            white-space: nowrap;
                            color: var(--jh-muted);
                            pointer-events: none;
                        }
                    `}</style>

					{/* -ml-11/pl-11 extend this wrapper's own hit-box 44px to the left (net
					    visual position of its content is unchanged) so the gutter icons —
					    rendered inside that reserved strip — stay geometrically inside this
					    element. Without it, the browser fires mouseleave on this wrapper the
					    moment the cursor reaches icons living outside its box, hiding them. */}
					<div className="relative -ml-11 pl-11" ref={onEditorWrapperRef}>
						<RichTextPlugin
							contentEditable={
								<ContentEditable
									className={cn(
										"rte-editor flex flex-col overflow-y-auto py-4 text-foreground outline-none",
										fullPage ? "min-h-[65vh] max-h-[75vh]" : "max-h-[80vh] min-h-40"
									)}
								/>
							}
							placeholder={null}
							ErrorBoundary={LexicalErrorBoundary}
						/>
						<HistoryPlugin />
						<ListPlugin />
						<LinkPlugin />
						<MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
						<EmptyBlockPlaceholderPlugin />
						<CtrlKLinkPlugin />
						<ImageDragDropPlugin />
						<ImageLifecyclePlugin />
						<SlashCommandPlugin />
						<FloatingTextFormatToolbarPlugin />
						<DraggableBlockPluginWrapper anchorElem={floatingAnchorElem} />
						<InitialContentPlugin content={content} />
						<AutocompletePlugin corpusTexts={corpusTexts} />
						<OnChangePlugin onChange={handleChange} />
						<EditorHandlePlugin editorRef={editorInstanceRef} />
					</div>
				</div>
			</ImageUploadContext.Provider>
		</LexicalComposer>
	);
});

export default RichTextEditor;
