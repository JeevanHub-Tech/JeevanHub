import { useRef, useState } from "react";
import axios from "axios";
import { ImagePlus, X } from "lucide-react";

import RichTextEditor from "@/components/LexicalEditor";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";

function authHeaders() {
	const token = localStorage.getItem("token");
	return { headers: { Authorization: `Bearer ${token}` } };
}

// Shared blog-authoring UI (cover image, title, category, rich text body) --
// used by both the doctor's WriteBlog screen and the admin blog editor so
// every role gets the same LexicalEditor-backed authoring experience instead
// of admin hand-rolling its own plain-textarea form.
function BlogComposer({
	title,
	onTitleChange,
	category,
	onCategoryChange,
	description,
	onDescriptionChange,
	coverImage,
	onCoverImageChange,
	corpusTexts = [],
	isLoading = false,
	titlePlaceholder = "Untitled blog",
	categoryPlaceholder = "Category — e.g., Nutrition, Mental Health, Fitness",
}) {
	const categoryInputRef = useRef(null);
	const editorRef = useRef(null);
	const coverInputRef = useRef(null);
	const [isUploadingCover, setIsUploadingCover] = useState(false);
	const [uploadError, setUploadError] = useState(null);

	const handleCoverPick = async (e) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		setIsUploadingCover(true);
		setUploadError(null);
		try {
			const formData = new FormData();
			formData.append("image", file);
			const res = await axios.post(`${BACKEND_URL}/api/blogs/upload-image`, formData, {
				headers: { ...authHeaders().headers, "Content-Type": "multipart/form-data" },
			});
			onCoverImageChange(res.data.url);
		} catch (err) {
			console.error("Error uploading cover image:", err);
			setUploadError("Failed to upload cover image.");
		} finally {
			setIsUploadingCover(false);
		}
	};

	return (
		<div className="flex flex-col gap-6 pb-32">
			<input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
			{coverImage ? (
				<div className="group relative h-56 w-full overflow-hidden rounded-lg sm:h-72">
					<img src={coverImage} alt="Cover" className="size-full object-cover" />
					<Button
						type="button"
						variant="secondary"
						size="icon"
						className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
						onClick={() => onCoverImageChange("")}
					>
						<X />
					</Button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => coverInputRef.current?.click()}
					disabled={isUploadingCover}
					className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
				>
					<ImagePlus className="size-4" />
					{isUploadingCover ? "Uploading..." : "Add cover image"}
				</button>
			)}
			{uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}

			<input
				placeholder={titlePlaceholder}
				value={title}
				onChange={(e) => onTitleChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						categoryInputRef.current?.focus();
					}
				}}
				style={{ outline: "none", boxShadow: "none" }}
				className="w-full border-none bg-transparent p-0 font-sans text-4xl font-bold text-foreground placeholder:text-muted-foreground/60"
			/>

			<input
				ref={categoryInputRef}
				placeholder={categoryPlaceholder}
				value={category}
				onChange={(e) => onCategoryChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						editorRef.current?.focus();
					}
				}}
				style={{ outline: "none", boxShadow: "none" }}
				className="w-full border-none bg-transparent p-0 font-sans text-xl font-medium text-muted-foreground placeholder:text-muted-foreground/60"
			/>

			{isLoading ? (
				<p className="text-sm text-muted-foreground">Loading blog...</p>
			) : (
				<RichTextEditor ref={editorRef} content={description} onChange={onDescriptionChange} corpusTexts={corpusTexts} fullPage />
			)}
		</div>
	);
}

export default BlogComposer;
