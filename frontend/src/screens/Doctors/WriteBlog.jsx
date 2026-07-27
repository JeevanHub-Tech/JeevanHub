import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ImagePlus, X } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import RichTextEditor from "../../components/LexicalEditor";
import { BACKEND_URL } from "../../config";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

function authHeaders() {
	const token = localStorage.getItem("token");
	return { headers: { Authorization: `Bearer ${token}` } };
}

export default function WriteBlog() {
	const { auth } = useContext(AuthContext);
	const doctorId = auth.user ? auth.user.id : null;
	const navigate = useNavigate();
	const { id: blogId } = useParams();
	const isEditMode = !!blogId;

	const categoryInputRef = useRef(null);
	const editorRef = useRef(null);
	const coverInputRef = useRef(null);

	const [title, setTitle] = useState("");
	const [category, setCategory] = useState("");
	const [description, setDescription] = useState("");
	const [coverImage, setCoverImage] = useState("");
	const [isUploadingCover, setIsUploadingCover] = useState(false);
	const [corpusTexts, setCorpusTexts] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingExisting, setIsLoadingExisting] = useState(isEditMode);
	const [error, setError] = useState(null);

	const handleCoverPick = async (e) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		setIsUploadingCover(true);
		try {
			const formData = new FormData();
			formData.append("image", file);
			const res = await axios.post(`${BACKEND_URL}/api/blogs/upload-image`, formData, {
				headers: { ...authHeaders().headers, "Content-Type": "multipart/form-data" },
			});
			setCoverImage(res.data.url);
		} catch (err) {
			console.error("Error uploading cover image:", err);
			setError("Failed to upload cover image.");
		} finally {
			setIsUploadingCover(false);
		}
	};

	useEffect(() => {
		if (!doctorId) return;
		axios
			.get(`${BACKEND_URL}/api/blogs/author/doctor/${doctorId}`)
			.then((res) => setCorpusTexts(res.data.map((b) => b.description)))
			.catch(() => {});
	}, [doctorId]);

	useEffect(() => {
		if (!isEditMode) return;
		axios
			.get(`${BACKEND_URL}/api/blogs/${blogId}`)
			.then((res) => {
				setTitle(res.data.title || "");
				setCategory(res.data.category || "");
				setDescription(res.data.description || "");
				setCoverImage(res.data.image || "");
			})
			.catch((err) => {
				console.error("Error loading blog:", err);
				setError("Failed to load this blog.");
			})
			.finally(() => setIsLoadingExisting(false));
	}, [isEditMode, blogId]);

	const handlePublish = async () => {
		if (!title.trim() || !description.trim()) {
			setError("Title and content are required.");
			return;
		}
		setIsSubmitting(true);
		setError(null);
		try {
			const payload = {
				title,
				description,
				category,
				image: coverImage,
			};
			if (isEditMode) {
				await axios.put(`${BACKEND_URL}/api/blogs/${blogId}`, payload, authHeaders());
			} else {
				await axios.post(`${BACKEND_URL}/api/blogs`, {
					...payload,
					authorType: "doctor",
					authorId: doctorId,
					date: new Date(),
				});
			}
			navigate("/health-blogs");
		} catch (err) {
			console.error("Error publishing blog:", err);
			setError("Failed to publish blog. Please try again.");
			setIsSubmitting(false);
		}
	};

	return (
		<DashboardShell className="bg-background">
			<div className="mx-auto flex max-w-3xl flex-col gap-6">
				<div className="flex items-center justify-between">
					<Button variant="ghost" onClick={() => navigate("/health-blogs")}>
						<ArrowLeft data-icon="inline-start" />
						Back to blogs
					</Button>
					<Button onClick={handlePublish} disabled={isSubmitting || isLoadingExisting}>
						{isSubmitting ? "Publishing..." : isEditMode ? "Save changes" : "Publish"}
					</Button>
				</div>

				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
				{coverImage ? (
					<div className="group relative h-56 w-full overflow-hidden rounded-lg sm:h-72">
						<img src={coverImage} alt="Cover" className="size-full object-cover" />
						<Button
							type="button"
							variant="secondary"
							size="icon"
							className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
							onClick={() => setCoverImage("")}
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

				<input
					placeholder="Untitled blog"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
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
					placeholder="Category — e.g., Nutrition, Mental Health, Fitness"
					value={category}
					onChange={(e) => setCategory(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							editorRef.current?.focus();
						}
					}}
					style={{ outline: "none", boxShadow: "none" }}
					className="w-full border-none bg-transparent p-0 font-sans text-xl font-medium text-muted-foreground placeholder:text-muted-foreground/60"
				/>

				{isLoadingExisting ? (
					<p className="text-sm text-muted-foreground">Loading blog...</p>
				) : (
					<RichTextEditor ref={editorRef} content={description} onChange={setDescription} corpusTexts={corpusTexts} fullPage />
				)}
			</div>
		</DashboardShell>
	);
}
