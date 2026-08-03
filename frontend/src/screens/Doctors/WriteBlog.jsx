import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import BlogComposer from "@/components/blog/BlogComposer";
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

	const [title, setTitle] = useState("");
	const [category, setCategory] = useState("");
	const [description, setDescription] = useState("");
	const [coverImage, setCoverImage] = useState("");
	const [corpusTexts, setCorpusTexts] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingExisting, setIsLoadingExisting] = useState(isEditMode);
	const [error, setError] = useState(null);

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

				<BlogComposer
					title={title}
					onTitleChange={setTitle}
					category={category}
					onCategoryChange={setCategory}
					description={description}
					onDescriptionChange={setDescription}
					coverImage={coverImage}
					onCoverImageChange={setCoverImage}
					corpusTexts={corpusTexts}
					isLoading={isLoadingExisting}
				/>
			</div>
		</DashboardShell>
	);
}
