import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import BlogComposer from "@/components/blog/BlogComposer";
import { BACKEND_URL } from "../../config";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useBlogDraft } from "@/hooks/useBlogDraft";

export default function AdminBlogsEditor() {
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const { id: blogId } = useParams();
	const isEditMode = !!blogId;
	const initialBlog = location.state?.initialBlog || {};

	const draftKey = `jh_blog_draft:admin:${isEditMode ? blogId : "new"}`;
	const {
		title, setTitle,
		category, setCategory,
		description, setDescription,
		coverImage, setCoverImage,
		url, setUrl,
		clearDraft,
	} = useBlogDraft(draftKey, {
		title: initialBlog.title || "",
		category: Array.isArray(initialBlog.category) ? initialBlog.category.join(", ") : initialBlog.category || "",
		description: initialBlog.description || "",
		coverImage: initialBlog.image || "",
		url: initialBlog.url || "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handleSave = async () => {
		if (!title.trim() || !description.trim()) {
			setError(t("adminBlogEditor.requiredError"));
			return;
		}
		setIsSubmitting(true);
		setError(null);
		try {
			if (isEditMode) {
				// Backend serves two blog collections (AI-generated + hand-written)
				// behind one update endpoint and applies whichever fields match the
				// model it finds -- so both shapes are sent, Mongoose drops the rest.
				const updatedData = {
					title,
					url,
					image: coverImage,
					description, // Blog model
					category: category.trim(), // Blog model
					tags: category // AIBlog model
						.split(",")
						.map((tag) => tag.trim())
						.filter(Boolean),
					content: { html: description }, // AIBlog model
				};

				const response = await fetch(`${BACKEND_URL}/api/webhook/updateBlog/${initialBlog._id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
					body: JSON.stringify(updatedData),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.message || t("adminBlogEditor.updateError"));
				}
			} else {
				const response = await fetch(`${BACKEND_URL}/api/blogs`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
					body: JSON.stringify({
						title,
						description,
						category: category.trim(),
						image: coverImage,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || errorData.message || t("adminBlogEditor.createError"));
				}
			}

			clearDraft();
			navigate("/admin/blogs");
		} catch (err) {
			console.error("Error saving blog:", err);
			setError(isEditMode ? t("adminBlogEditor.updateError") : t("adminBlogEditor.createError"));
			setIsSubmitting(false);
		}
	};

	return (
		<DashboardShell className="bg-background">
			<div className="mx-auto flex max-w-3xl flex-col gap-6">
				<div className="flex items-center justify-between">
					<Button variant="ghost" onClick={() => navigate("/admin/blogs")}>
						<ArrowLeft data-icon="inline-start" />
						{t("adminBlogEditor.back")}
					</Button>
					<Button onClick={handleSave} disabled={isSubmitting}>
						{isSubmitting ? t("adminBlogEditor.saving") : isEditMode ? t("adminBlogEditor.saveChanges") : t("adminBlogEditor.publish")}
					</Button>
				</div>

				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				{isEditMode ? (
					<Field>
						<FieldLabel htmlFor="url">{t("adminBlogEditor.url")}</FieldLabel>
						<Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("adminBlogEditor.urlPlaceholder")} />
					</Field>
				) : null}

				<BlogComposer
					title={title}
					onTitleChange={setTitle}
					category={category}
					onCategoryChange={setCategory}
					categoryPlaceholder={isEditMode ? t("adminBlogEditor.tagsPlaceholder") : t("adminBlogEditor.categoryPlaceholder")}
					description={description}
					onDescriptionChange={setDescription}
					coverImage={coverImage}
					onCoverImageChange={setCoverImage}
				/>
			</div>
		</DashboardShell>
	);
}

