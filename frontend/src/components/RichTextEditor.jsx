import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Heading from "@tiptap/extension-heading";
import YouTube from '@tiptap/extension-youtube';

import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Image as ImageIcon,
    Link as LinkIcon,
    Highlighter,
    Heading1,
    Film,
} from "lucide-react";

import { cn } from "@/lib/utils";

// Toolbar buttons all share this dark-chrome toggle look; active state is
// driven per-render from editor.isActive(...), not a variant prop, so a
// small local helper keeps the className logic out of the JSX below.
const toolbarButtonClass = (isActive) =>
    cn(
        "cursor-pointer rounded-md p-1.5 text-(--jh-chrome-text) transition-colors",
        "hover:bg-(--jh-chrome-border) hover:text-(--jh-chrome-text-strong)",
        isActive && "bg-(--jh-chrome-active) text-(--jh-chrome-text-strong)"
    );

const RichTextEditor = ({ content, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
            }),
            Heading.configure({
                levels: [1, 2, 3, 4, 5, 6],
                HTMLAttributes: {
                    class: "my-heading",
                },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight,
            Link.configure({ openOnClick: false }),
            Image,
            YouTube.configure({
                nocookie: true, 
                controls: true, 
                width: '100%',
                allowFullscreen: true,
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            BulletList,
            OrderedList,
            ListItem,
            Placeholder.configure({
                placeholder: "Write your amazing blog here...",
            }),
        ],
        content,
        // The onUpdate function is crucial here to trigger re-renders
        // when the editor state changes, which allows isActive() to work.
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    if (!editor) return null;

    const handleHeadingChange = (e) => {
        const level = e.target.value;
        if (level === "paragraph") editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({ level: parseInt(level) }).run();
    };

    // Helper to get the current heading level for the dropdown
    const getCurrentHeadingLevel = () => {
        for (let i = 1; i <= 6; i++) {
            if (editor.isActive('heading', { level: i })) {
                return String(i);
            }
        }
        return "paragraph";
    };

    return (
        <div className="w-full self-center rounded-lg bg-(--jh-chrome-bg) p-2.5 text-(--jh-chrome-text-strong)">
            {/* This <style> block covers only selectors that target HTML Tiptap/ProseMirror
                injects into the contenteditable area at runtime (headings, lists, links,
                highlight marks, the empty-state placeholder, embedded video wrapper). That
                markup isn't React-rendered JSX, so Tailwind utility classes can't reach it —
                these rules have no Tailwind-equivalent and must stay as real CSS. */}
            <style>{`
                .rte-editor .ProseMirror {
                    min-height: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    outline: none;
                    padding: 12px;
                    font-family: var(--jh-font-body);
                    color: var(--jh-ink);
                }
                .rte-editor .ProseMirror.is-editor-empty::before,
                .rte-editor .ProseMirror p.is-editor-empty::before {
                    color: var(--jh-muted);
                }
                .rte-editor .ProseMirror h1,
                .rte-editor .ProseMirror h2,
                .rte-editor .ProseMirror h3,
                .rte-editor .ProseMirror h4,
                .rte-editor .ProseMirror h5,
                .rte-editor .ProseMirror h6 {
                    color: var(--jh-ink);
                }
                .rte-editor .ProseMirror p {
                    margin: 0.5em 0;
                }
                .rte-editor .ProseMirror mark {
                    background-color: var(--jh-turmeric-gold);
                    color: var(--jh-ink);
                }
                .rte-editor .ProseMirror a {
                    color: var(--jh-olive-leaf);
                    text-decoration: underline;
                    cursor: pointer;
                }
                .rte-editor .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5em;
                    margin: 0.5em 0;
                }
                .rte-editor .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5em;
                    margin: 0.5em 0;
                }
                .rte-editor .iframe-container,
                .blog-content .iframe-container {
                    position: relative;
                    width: 100%;
                }
            `}</style>

            <div className="mb-2.5 flex flex-wrap items-center gap-2 rounded-md bg-(--jh-chrome-surface) p-2">
                {/* 1. Heading Dropdown Fix (using value and onChange) */}
                <div className="flex items-center gap-1">
                    <Heading1 size={18} />
                    <select
                        onChange={handleHeadingChange}
                        value={getCurrentHeadingLevel()} // Set the current active value
                        className="rounded border border-(--jh-chrome-border) bg-(--jh-chrome-surface) px-1.5 py-1 text-sm text-(--jh-chrome-text-strong)"
                    >
                        <option value="paragraph">Paragraph</option>
                        <option value="1">H1</option>
                        <option value="2">H2</option>
                        <option value="3">H3</option>
                        <option value="4">H4</option>
                        <option value="5">H5</option>
                        <option value="6">H6</option>
                    </select>
                </div>

                {/* 2. Bold Button Fix (using editor.isActive() and a conditional class) */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={toolbarButtonClass(editor.isActive("bold"))}
                >
                    <Bold size={18} />
                </button>

                {/* Italic Button Fix */}
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={toolbarButtonClass(editor.isActive("italic"))}
                >
                    <Italic size={18} />
                </button>

                {/* Underline Button Fix */}
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={toolbarButtonClass(editor.isActive("underline"))}
                >
                    <UnderlineIcon size={18} />
                </button>

                {/* Bullet List Fix */}
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={toolbarButtonClass(editor.isActive("bulletList"))}
                >
                    <List size={18} />
                </button>

                {/* Ordered List Fix */}
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={toolbarButtonClass(editor.isActive("orderedList"))}
                >
                    <ListOrdered size={18} />
                </button>

                {/* Text Align Buttons Fix */}
                <button
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    className={toolbarButtonClass(editor.isActive({ textAlign: "left" }))}
                >
                    <AlignLeft size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    className={toolbarButtonClass(editor.isActive({ textAlign: "center" }))}
                >
                    <AlignCenter size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    className={toolbarButtonClass(editor.isActive({ textAlign: "right" }))}
                >
                    <AlignRight size={18} />
                </button>

                {/* Highlight Button Fix */}
                <button
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    className={toolbarButtonClass(editor.isActive("highlight"))}
                >
                    <Highlighter size={18} />
                </button>

                {/* Link and Image buttons don't typically have an active state in the same way,
                    but you could check if a link is active for a "remove link" button if you wanted.
                    I'll keep them as they are for simplicity here. */}
                <button
                    onClick={() => {
                        const url = window.prompt("Enter image URL:");
                        if (url) editor.chain().focus().setImage({ src: url }).run();
                    }}
                    className={toolbarButtonClass(false)}
                >
                    <ImageIcon size={18} />
                </button>

                {/* Video/YouTube Button */}
                 <button
                    onClick={() => {
                        const url = window.prompt("Enter YouTube URL or Video ID:");
                        if (url) {
                            editor.chain().focus().setYoutubeVideo({
                                src: url,
                                width: 640,
                                height: 480,
                            }).run();
                        }
                    }}
                    className={toolbarButtonClass(false)}
                >
                    <Film size={18} />
                </button>

                {/* Hyperlink */}
                <button
                    onClick={() => {
                        const url = window.prompt("Enter link URL (e.g., https://www.google.com):");

                        if (url) {
                            let fullUrl = url.trim();

                            if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://') && !fullUrl.startsWith('mailto:') && !fullUrl.startsWith('tel:')) {
                                fullUrl = `https://${fullUrl}`;
                            }

                            editor.chain().focus().setLink({ href: fullUrl }).run();
                        } else {
                            editor.chain().focus().unsetLink().run();
                        }
                    }}
                    className={toolbarButtonClass(editor.isActive("link"))}
                >
                    <LinkIcon size={18} />
                </button>
            </div>
            <EditorContent
                editor={editor}
                className="rte-editor flex max-h-[80vh] flex-col overflow-y-scroll rounded-md border border-(--jh-line-strong) bg-(--jh-surface) p-3 text-(--jh-ink) focus-within:border-(--jh-olive-leaf)"
            />
        </div>
    );
};

export default RichTextEditor;