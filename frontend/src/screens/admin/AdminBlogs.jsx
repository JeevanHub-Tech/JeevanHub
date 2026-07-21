import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { CircleCheck, CircleAlert, ExternalLink } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const formatDate = (isoString) => moment(isoString).format("DD MMM YYYY");

const AdminBlogs = () => {
	const { auth } = useContext(AuthContext);
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState("view");
	const [blogs, setBlogs] = useState([]);
	const [newBlog, setNewBlog] = useState({
		title: "",
		description: "",
		image: "",
		type: "Blog",
		tags: "",
	});
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
			const sorted = items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
			setBlogs(sorted);
			setError(null);
		} catch (err) {
			console.error("Error fetching blogs:", err);
			setError("Failed to fetch blogs. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setNewBlog((prev) => ({ ...prev, [name]: value }));
	};

	const addBlog = async () => {
		if (!newBlog.title || !newBlog.description) {
			setError("Please fill required fields (title and content)!");
			return;
		}

		const authorFirstName = auth.user?.firstName || "Unknown";
		const authorLastName = auth.user?.lastName || "Admin";
		const fullAuthorName = `${authorFirstName} ${authorLastName}`.trim();

		const tagsArray = newBlog.tags
			? newBlog.tags
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean)
			: [];

		const payload = {
			title: newBlog.title,
			type: newBlog.type || "Blog",
			author: fullAuthorName,
			tags: tagsArray,
			content: {
				text: newBlog.description,
				images: newBlog.image ? [{ url: newBlog.image }] : [],
			},
			timestamp: new Date().toISOString(),
		};

		setIsLoading(true);
		try {
			await axios.post(`${BACKEND_URL}/api/webhook/createBlog`, payload);
			await fetchBlogs();

			setNewBlog({
				title: "",
				description: "",
				image: "",
				type: "Blog",
				tags: "",
			});

			setSuccessAlert("Blog post added successfully!");
			setTimeout(() => setSuccessAlert(null), 3000);
			setError(null);
		} catch (err) {
			console.error("Error adding blog:", err);
			setError("Failed to create blog. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const deleteBlog = async (id) => {
		if (!window.confirm("Are you sure you want to delete this blog post?")) return;

		setIsLoading(true);
		try {
			await axios.delete(`${BACKEND_URL}/api/webhook/deleteBlog/${id}`);
			setBlogs((prev) => prev.filter((b) => b._id !== id));
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

	const handleUpdateClick = (blog) => {
		navigate(`/admin/blogs/update/${blog._id}`, { state: { initialBlog: blog } });
	};

	return (
		<DashboardShell>
			<DashboardPageHeader title="Admin Blog Management" />

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
					<TabsTrigger value="add">Add New Blog</TabsTrigger>
					<TabsTrigger value="generate">Generate Content</TabsTrigger>
				</TabsList>

				<TabsContent value="view">
					{isLoading ? <p className="text-center text-muted-foreground">Loading blogs...</p> : null}
					{!isLoading && blogs.length === 0 ? (
						<p className="text-center text-muted-foreground">No blogs available.</p>
					) : null}
					{blogs.length > 0 ? (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{blogs.map((blog) => {
								const img = blog?.content?.images?.length ? blog.content.images[0].url : "";
								const desc = blog?.content?.text || "";
								return (
									<Card key={blog._id} className="overflow-hidden py-0 transition-transform hover:-translate-y-1">
										{img ? (
											<div className="aspect-video overflow-hidden">
												<img src={img} alt={blog.title} className="size-full object-cover" />
											</div>
										) : null}
										<div className="flex flex-col gap-2 p-4">
											<h3 className="text-lg font-semibold text-foreground">{blog.title}</h3>
											<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
												<span>
													By: {blog.author || "Anonymous"} | {formatDate(blog.timestamp)}
												</span>
												{blog.type ? (
													<Badge variant="secondary" className="ml-auto">
														{blog.type}
													</Badge>
												) : null}
											</div>
											<p className="text-sm text-foreground/80">
												{desc.substring(0, 150)}
												{desc.length > 150 ? "..." : ""}
											</p>
											{Array.isArray(blog.tags) && blog.tags.length > 0 ? (
												<div className="flex flex-wrap gap-2">
													{blog.tags.map((t, i) => (
														<Badge key={i} variant="outline">
															#{t}
														</Badge>
													))}
												</div>
											) : null}
										</div>
										<div className="flex justify-end gap-2 bg-muted/40 p-3">
											<Button variant="outline" size="sm" disabled={isLoading} onClick={() => handleUpdateClick(blog)}>
												Update
											</Button>
											<Button variant="destructive" size="sm" disabled={isLoading} onClick={() => deleteBlog(blog._id)}>
												Delete
											</Button>
										</div>
									</Card>
								);
							})}
						</div>
					) : null}
				</TabsContent>

				<TabsContent value="add">
					<Card className="max-w-2xl p-6">
						<h2 className="mb-5 text-lg font-semibold text-foreground">Add New Blog</h2>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="title">
									Blog Title <span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="title"
									name="title"
									value={newBlog.title}
									onChange={handleChange}
									placeholder="Enter blog title"
									required
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="description">
									Blog Content <span className="text-destructive">*</span>
								</FieldLabel>
								<Textarea
									id="description"
									name="description"
									value={newBlog.description}
									onChange={handleChange}
									placeholder="Enter blog content"
									rows={8}
									required
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="type">Type</FieldLabel>
								<Select value={newBlog.type} onValueChange={(value) => setNewBlog((prev) => ({ ...prev, type: value }))}>
									<SelectTrigger id="type">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Blog">Blog</SelectItem>
										<SelectItem value="Video">Video</SelectItem>
									</SelectContent>
								</Select>
							</Field>

							<Field>
								<FieldLabel htmlFor="tags">Tags (comma separated)</FieldLabel>
								<Input
									id="tags"
									name="tags"
									value={newBlog.tags}
									onChange={handleChange}
									placeholder="e.g., health, herbs, diet"
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="image">Image URL</FieldLabel>
								<Input
									id="image"
									name="image"
									value={newBlog.image}
									onChange={handleChange}
									placeholder="Enter image URL (optional)"
								/>
								{newBlog.image ? (
									<div className="mt-2 max-h-52 overflow-hidden rounded-lg border border-border">
										<img src={newBlog.image} alt="Preview" className="w-full object-contain" />
									</div>
								) : null}
							</Field>

							<Button onClick={addBlog} disabled={isLoading} className="w-fit">
								{isLoading ? "Adding..." : "Add Blog"}
							</Button>
						</FieldGroup>
					</Card>
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
							Once your content is ready, copy it back here and add it using the "Add New Blog" tab.
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
