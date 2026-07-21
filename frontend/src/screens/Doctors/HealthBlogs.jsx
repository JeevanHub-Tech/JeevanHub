import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ChevronDown } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import RichTextEditor from "../../components/RichTextEditor";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function HealthBlogs() {
	const { auth } = useContext(AuthContext);
	const doctorId = auth.user ? auth.user.id : null;
	const [expandedBlogId, setExpandedBlogId] = useState(null);

	const [activeTab, setActiveTab] = useState("recent");
	const [blogs, setBlogs] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		category: "",
		image: "",
	});

	useEffect(() => {
		if (doctorId) {
			const fetchBlogs = async () => {
				setIsLoading(true);
				try {
					const response = await axios.get(`${BACKEND_URL}/api/blogs/author/doctor/${doctorId}`);
					setBlogs(response.data);
					setError(null);
				} catch (error) {
					console.error("Error fetching blogs:", error);
					setError("Failed to fetch your blogs. Please try again.");
				} finally {
					setIsLoading(false);
				}
			};
			fetchBlogs();
		}
	}, [doctorId]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!doctorId) {
			setError("Doctor ID is missing. Please ensure you are logged in.");
			return;
		}

		const dataToSubmit = {
			...formData,
			authorType: "doctor",
			authorId: doctorId,
			date: new Date(),
		};

		setIsLoading(true);
		try {
			const response = await axios.post(`${BACKEND_URL}/api/blogs`, dataToSubmit);
			setBlogs([response.data, ...blogs]);
			setActiveTab("recent");

			setFormData({
				title: "",
				description: "",
				category: "",
				image: "",
			});

			setError(null);
		} catch (error) {
			console.error("Error publishing blog:", error);
			setError("Failed to publish blog. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<DashboardShell>
			<DashboardPageHeader title="My Health Blogs" />

			{error ? (
				<Alert variant="destructive" className="mb-6">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="mb-6">
					<TabsTrigger value="write">Write a Blog</TabsTrigger>
					<TabsTrigger value="recent">Recent Blogs</TabsTrigger>
				</TabsList>

				<TabsContent value="recent">
					{isLoading ? <p className="text-center text-muted-foreground">Loading your blogs...</p> : null}
					{!isLoading && blogs.length === 0 ? (
						<p className="text-center text-muted-foreground">You haven't published any blogs yet.</p>
					) : null}
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{blogs.map((blog, index) => {
							const blogId = blog._id || index;
							const isExpanded = expandedBlogId === blogId;
							return (
								<Card key={blogId} className="relative p-5">
									<button
										type="button"
										onClick={() => setExpandedBlogId(isExpanded ? null : blogId)}
										className="absolute top-4 right-4 text-muted-foreground"
										aria-label="Toggle blog details"
									>
										<ChevronDown className={isExpanded ? "size-5 rotate-180 transition-transform" : "size-5 transition-transform"} />
									</button>
									<h2 className="pr-6 text-lg font-semibold text-foreground">{blog.title}</h2>
									{blog.category ? (
										<Badge variant="secondary" className="mt-2">
											{blog.category}
										</Badge>
									) : null}
									{isExpanded ? (
										<div className="mt-4 flex flex-col gap-3">
											<div
												className="text-sm leading-relaxed text-foreground/80"
												dangerouslySetInnerHTML={{ __html: blog.description }}
											/>
											{blog.image ? (
												<img src={blog.image} alt={blog.title} className="w-full rounded-lg" />
											) : null}
										</div>
									) : null}
									<p className="mt-3 text-xs font-semibold text-muted-foreground">
										Published: {new Date(blog.date).toLocaleDateString()}
									</p>
								</Card>
							);
						})}
					</div>
				</TabsContent>

				<TabsContent value="write">
					<Card className="mx-auto max-w-2xl p-6">
						<h2 className="mb-5 text-lg font-semibold text-foreground">Write a New Blog</h2>
						<form onSubmit={handleSubmit}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="title">
										Title <span className="text-destructive">*</span>
									</FieldLabel>
									<Input
										id="title"
										name="title"
										placeholder="Enter blog title"
										value={formData.title}
										onChange={handleInputChange}
										required
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="description">
										Description <span className="text-destructive">*</span>
									</FieldLabel>
									<RichTextEditor
										content={formData.description}
										onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="category">Category</FieldLabel>
									<Input
										id="category"
										name="category"
										placeholder="E.g., Nutrition, Mental Health, Fitness"
										value={formData.category}
										onChange={handleInputChange}
										required
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="image">Image URL</FieldLabel>
									<Input
										id="image"
										name="image"
										placeholder="Enter image URL (optional)"
										value={formData.image}
										onChange={handleInputChange}
									/>
								</Field>

								<Button type="submit" disabled={isLoading} className="w-fit">
									{isLoading ? "Publishing..." : "Publish Blog"}
								</Button>
							</FieldGroup>
						</form>
					</Card>
				</TabsContent>
			</Tabs>
		</DashboardShell>
	);
}

export default HealthBlogs;
