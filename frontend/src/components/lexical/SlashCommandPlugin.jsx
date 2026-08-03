import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalTypeaheadMenuPlugin, MenuOption, useBasicTypeaheadTriggerMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $getSelection, $isRangeSelection, $createParagraphNode } from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $insertList } from "@lexical/list";
import { Heading1, Heading2, Heading3, Heading4, List, ListOrdered, Quote, Type, Image as ImageIcon, Film } from "lucide-react";

import { $createImageNode } from "@/components/lexical/ImageNode";
import { $createYouTubeNode } from "@/components/lexical/YouTubeNode";
import { $createTwitterNode } from "@/components/lexical/TwitterNode";
import { useImageUpload } from "@/components/lexical/ImageUploadContext";
import { usePrompt } from "@/context/PromptDialogContext";
import { extractYouTubeId, isTwitterUrl } from "@/lib/twitterWidgets";
import { $insertBlockAndFocusNext } from "@/components/lexical/insertBlockAndFocusNext";

class BlockOption extends MenuOption {
	constructor(title, icon, keywords, onSelect) {
		super(title);
		this.title = title;
		this.icon = icon;
		this.keywords = keywords;
		this.onSelect = onSelect;
	}
}

// Notion-style "/" block picker. Basic blocks apply in-place via
// $setBlocksType (same mechanic as the toolbar's heading dropdown); Image
// opens a file picker straight to Cloudinary; Embed prompts for a
// YouTube/Twitter link — same insertion helpers the toolbar uses.
export default function SlashCommandPlugin() {
	const [editor] = useLexicalComposerContext();
	const { uploadImage, registerUpload } = useImageUpload();
	const prompt = usePrompt();
	const [queryString, setQueryString] = useState(null);

	const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("/", { minLength: 0 });

	const insertImageViaPicker = useCallback(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			const result = await uploadImage(file);
			if (!result) return;
			registerUpload(result.url, result.publicId);
			editor.update(() => {
				$insertBlockAndFocusNext($createImageNode(result.url, file.name, result.publicId));
			});
		};
		input.click();
	}, [editor, uploadImage, registerUpload]);

	const insertEmbed = useCallback(async () => {
		const url = await prompt({
			title: "Embed a link",
			description: "YouTube video, or a Twitter/X post URL.",
			placeholder: "https://...",
		});
		if (!url) return;
		const trimmed = url.trim();
		const videoId = extractYouTubeId(trimmed);
		editor.update(() => {
			let node = null;
			if (videoId) node = $createYouTubeNode(videoId);
			else if (isTwitterUrl(trimmed)) node = $createTwitterNode(trimmed);
			if (!node) return;
			$insertBlockAndFocusNext(node);
		});
	}, [editor, prompt]);

	const allOptions = useMemo(
		() => [
			new BlockOption("Text", Type, ["paragraph", "text"], () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createParagraphNode());
			}),
			new BlockOption("Heading 1", Heading1, ["h1", "heading", "#"], () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode("h1"));
			}),
			new BlockOption("Heading 2", Heading2, ["h2", "heading", "##"], () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode("h2"));
			}),
			new BlockOption("Heading 3", Heading3, ["h3", "heading", "###"], () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode("h3"));
			}),
			new BlockOption("Heading 4", Heading4, ["h4", "heading", "####"], () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode("h4"));
			}),
			new BlockOption("Bulleted list", List, ["ul", "bullet", "-"], () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) $insertList("bullet");
			}),
			new BlockOption("Numbered list", ListOrdered, ["ol", "number", "1."], () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) $insertList("number");
			}),
			new BlockOption("Quote", Quote, ["blockquote", ">"], () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createQuoteNode());
			}),
			new BlockOption("Image", ImageIcon, ["upload", "picture", "photo"], () => insertImageViaPicker()),
			new BlockOption("Embed", Film, ["youtube", "twitter", "video", "x.com"], () => insertEmbed()),
		],
		[insertImageViaPicker, insertEmbed]
	);

	const options = useMemo(() => {
		if (!queryString) return allOptions;
		const lower = queryString.toLowerCase();
		return allOptions.filter(
			(option) => option.title.toLowerCase().includes(lower) || option.keywords.some((k) => k.toLowerCase().includes(lower))
		);
	}, [allOptions, queryString]);

	const onSelectOption = useCallback(
		(selectedOption, nodeToRemove, closeMenu) => {
			editor.update(() => {
				if (nodeToRemove) nodeToRemove.remove();
				selectedOption.onSelect();
			});
			closeMenu();
		},
		[editor]
	);

	return (
		<LexicalTypeaheadMenuPlugin
			onQueryChange={setQueryString}
			onSelectOption={onSelectOption}
			triggerFn={checkForTriggerMatch}
			options={options}
			menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) =>
				anchorElementRef.current && options.length > 0
					? createPortal(
							<div
							className="z-50 max-h-[min(320px,calc(100vh-2rem))] w-64 overflow-y-auto rounded-lg border border-border bg-card py-1.5 shadow-lg"
						>
								{options.map((option, index) => (
									<button
										key={option.key}
										type="button"
										className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground ${
											index === selectedIndex ? "bg-accent" : ""
										}`}
										onMouseEnter={() => setHighlightedIndex(index)}
										onClick={() => selectOptionAndCleanUp(option)}
									>
										<option.icon size={16} className="shrink-0 text-muted-foreground" />
										{option.title}
									</button>
								))}
							</div>,
							anchorElementRef.current
						)
					: null
			}
		/>
	);
}
