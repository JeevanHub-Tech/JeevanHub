import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { CircleCheck, CircleAlert, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfirm } from "@/context/PromptDialogContext";

const formatDate = (isoString) => {
	const date = new Date(isoString);
	return Number.isNaN(date.getTime()) ? "Unknown date" : format(date, "dd MMM yyyy");
};

const AdminBlogs = () => {
	const navigate = useNavigate();
	const confirm = useConfirm();

	const [activeTab, setActiveTab] = useState("view");
	const [blogs, setBlogs] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [successAlert, setSuccessAlert] = useState(null);

	useEffect(() => {
		fetchBlogs();
	}, []);

	const fetchBlogs = async () => {
		setIsLoading(true);
		try {
			const res = await axios.get(`${BACKEND_URL}/api/webhook/getAllBlogs/`);
			const items = Array.isArray(res.data?.blogs) ? res.data.blogs : [];
			const sorted = items.sort((a, b) => new Date(b.date) - new Date(a.date));
			setBlogs(sorted);
			setError(null);
		} catch (err) {
			console.error("Error fetching blogs:", err);
			setError("Failed to fetch blogs. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const deleteBlog = async (blog) => {
		const confirmed = await confirm({
			title: "Delete this blog?",
			description: `"${blog.title}" will be permanently removed.`,
			danger: true,
		});
		if (!confirmed) return;

		setIsLoading(true);
		try {
			await axios.delete(`${BACKEND_URL}/api/webhook/deleteBlog/${blog._id}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
			});
			setBlogs((prev) => prev.filter((b) => b._id !== blog._id));
			setSuccessAlert("Blog deleted successfully!");
			setTimeout(() => setSuccessAlert(null), 3000);
			setError(null);
		} catch (err) {
			console.error("Error deleting blog:", err);
			setError("Failed to delete blog. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<DashboardShell>
			<DashboardPageHeader
				title="Admin Blog Management"
				actions={
					<Button onClick={() => navigate("/admin/blogs/new")}>
						<Plus data-icon="inline-start" />
						Blog
					</Button>
				}
			/>

			{error ? (
				<Alert variant="destructive" className="mb-6">
					<CircleAlert />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}
			{successAlert ? (
				<Alert className="mb-6">
					<CircleCheck />
					<AlertDescription>{successAlert}</AlertDescription>
				</Alert>
			) : null}

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="mb-6">
					<TabsTrigger value="view">View All Blogs</TabsTrigger>
					<TabsTrigger value="generate">Generate Content</TabsTrigger>
				</TabsList>

				<TabsContent value="view">
					{isLoading ? <p className="text-center text-muted-foreground">Loading blogs...</p> : null}
					{!isLoading && blogs.length === 0 ? (
						<p className="text-center text-muted-foreground">No blogs available.</p>
					) : null}
					<div className="flex flex-col gap-3">
						{blogs.map((blog) => {
							const previewText = blog.description
								? blog.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
								: "";
							return (
								<Card key={blog._id} className="p-4">
									<div className="flex flex-col gap-1">
										<div className="flex flex-wrap items-center gap-2">
											<h2 className="text-base font-semibold text-foreground">{blog.title}</h2>
											{blog.category ? <Badge variant="secondary">{blog.category}</Badge> : null}
											<span className="ml-auto text-xs text-muted-foreground">{formatDate(blog.date)}</span>
											<Button
												variant="ghost"
												size="icon"
												disabled={isLoading}
												onClick={() => navigate(`/admin/blogs/update/${blog._id}`, { state: { initialBlog: blog } })}
											>
												<Pencil className="size-4" />
											</Button>
											<Button variant="ghost" size="icon" disabled={isLoading} onClick={() => deleteBlog(blog)}>
												<Trash2 className="size-4 text-destructive" />
											</Button>
										</div>
										<p className="line-clamp-2 text-sm text-muted-foreground sm:line-clamp-3">
											{previewText}
											{previewText.length >= 200 ? "..." : ""}
										</p>
									</div>
								</Card>
							);
						})}
					</div>
				</TabsContent>

				<TabsContent value="generate">
					<Card className="max-w-2xl p-6">
						<h2 className="mb-3 text-lg font-semibold text-foreground">Generate Blog Content</h2>
						<p className="text-sm text-foreground/80">
							This feature currently works via an external tool. Clicking the button below will open{" "}
							<a
								href="https://agiagentworld.com/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline hover:no-underline"
							>
								AGI Agent World
							</a>{" "}
							in a new tab.
						</p>
						<p className="mt-3 text-sm text-foreground/80">
							Once your content is ready, copy it back here and add it using the "+ Blog" button above.
						</p>
						<p className="mt-3 text-sm text-foreground/80">Happy creating!</p>

						<Button
							className="mt-4"
							onClick={() => window.open("https://agiagentworld.com/", "_blank", "noopener,noreferrer")}
						>
							Go to AGI Agent World <ExternalLink data-icon="inline-end" />
						</Button>
					</Card>
				</TabsContent>
			</Tabs>
		</DashboardShell>
	);
};

export default AdminBlogs;
