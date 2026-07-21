import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import RichTextEditor from "../../components/RichTextEditor";
import { BACKEND_URL } from "../../config";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function AdminBlogUpdate() {
	const location = useLocation();
	const navigate = useNavigate();
	const { initialBlog } = location.state;

	const [blog, setBlog] = useState({
		_id: initialBlog._id || "",
		title: initialBlog.title || "",
		url: initialBlog.url || "",
		category: Array.isArray(initialBlog.category) ? initialBlog.category.join(", ") : initialBlog.category || "",
		content: initialBlog.description || "",
	});

	const handleChange = (eOrHtmlString) => {
		if (eOrHtmlString && eOrHtmlString.target) {
			const { name, value } = eOrHtmlString.target;
			setBlog({
				...blog,
				[name]: value,
			});
		} else {
			setBlog((prevBlog) => ({
				...prevBlog,
				content: eOrHtmlString,
			}));
		}
	};

	const handleUpdate = async () => {
		const updatedData = {
			...blog,
			title: blog.title,
			url: blog.url,
			tags: blog.category
				.split(",")
				.map((tag) => tag.trim())
				.filter((tag) => tag),
			content: {
				html: blog.content,
			},
		};

		const apiUrl = `${BACKEND_URL}/api/webhook/updateBlog/${updatedData._id}`;

		try {
			const response = await fetch(apiUrl, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedData),
			});

			if (response.ok) {
				await response.json();
				navigate("/admin/blogs");
			} else {
				const errorData = await response.json();
				console.error("Failed to update blog:", response.status, errorData);
			}
		} catch (error) {
			console.error("An error occurred during the fetch call:", error);
		}
	};

	return (
		<DashboardShell>
			<Card className="mx-auto max-w-3xl p-6 sm:p-8">
				<h1 className="mb-6 text-center text-3xl font-extrabold text-foreground sm:text-4xl">Edit Blog Post</h1>

				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="title">Title</FieldLabel>
						<Input type="text" name="title" id="title" value={blog.title} onChange={handleChange} />
					</Field>

					<Field>
						<FieldLabel htmlFor="url">URL</FieldLabel>
						<Input type="text" name="url" id="url" value={blog.url} onChange={handleChange} />
					</Field>

					<Field>
						<FieldLabel htmlFor="category">Tags (comma-separated)</FieldLabel>
						<Input type="text" name="category" id="category" value={blog.category} onChange={handleChange} />
					</Field>

					<Field>
						<FieldLabel htmlFor="content">Content</FieldLabel>
						<RichTextEditor content={blog.content} onChange={handleChange} />
					</Field>
				</FieldGroup>

				<div className="flex justify-center pt-4">
					<Button onClick={handleUpdate}>Update Blog</Button>
				</div>
			</Card>
		</DashboardShell>
	);
}
