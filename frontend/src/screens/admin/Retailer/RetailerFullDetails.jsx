import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingBag, MessageCircleMore, Mail, Phone, MapPin, ArrowLeft, Briefcase } from "lucide-react";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RetailerOrdersTab from "./RetailerOrdersTab";
import RetailerProfileTab from "./RetailerProfileTab";
import RetailerFeedbackTab from "./RetailerFeedbackTab";
import { BACKEND_URL } from "../../../config";
import { authFetch } from "../../../utils/authFetch";

const dummyRetailerData = [
	{
		_id: "66e2c4d68b7573f0c2934a1b",
		firstName: "John",
		lastName: "Doe",
		BusinessName: "The Herbal Corner",
		email: "john.doe@example.com",
		phone: "123-456-7890",
		dob: "1985-05-15T00:00:00.000Z",
		licenseNumber: "LIC-A12345",
		age: 39,
		gender: "Male",
		zipCode: "10001",
		password: "********",
		status: "active",
	},
];

const fetchRetailerById = async (retailerId, setRetailer, setLoading, setError) => {
	setLoading(true);
	setError(null);
	try {
		const token = localStorage.getItem("token");
		const res = await authFetch(`${BACKEND_URL}/api/retailers/getSingleRetailer/${retailerId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.message || "Failed to fetch retailer");
		}

		const data = await res.json();
		setRetailer(data);
	} catch (error) {
		console.error("Error fetching retailer:", error);
		setError(error.message);
	} finally {
		setLoading(false);
	}
};

const tabs = [
	{ name: "Profile", icon: Briefcase },
	{ name: "Orders", icon: ShoppingBag },
	{ name: "Feedback", icon: MessageCircleMore },
];

const RetailerFullDetails = () => {
	const navigate = useNavigate();
	const { id: retailerId } = useParams();
	const [activeTab, setActiveTab] = useState("Profile");
	const [retailer, setRetailer] = useState(dummyRetailerData.find((r) => r._id === "66e2c4d68b7573f0c2934a1b"));
	const [, setLoading] = useState(false);
	const [, setError] = useState(null);

	useEffect(() => {
		if (retailerId) {
			fetchRetailerById(retailerId, setRetailer, setLoading, setError);
		}
	}, [retailerId]);

	const renderContent = () => {
		switch (activeTab) {
			case "Profile":
				return <RetailerProfileTab retailer={retailer} />;
			case "Orders":
				return <RetailerOrdersTab retailerId={retailerId} />;
			case "Feedback":
				return <RetailerFeedbackTab retailerId={retailerId} />;
			default:
				return null;
		}
	};

	if (!retailer) {
		return (
			<DashboardShell>
				<p className="text-center text-muted-foreground">Retailer not found.</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
				<ArrowLeft data-icon="inline-start" /> Back to Retailers
			</Button>

			<DashboardPageHeader title="Retailer Profile" description="Detailed information and activity" />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
				<Card className="h-fit p-6 text-center">
					<Avatar className="mx-auto size-20 text-2xl">
						<AvatarFallback>{retailer.firstName.charAt(0)}</AvatarFallback>
					</Avatar>
					<h2 className="mt-3 text-lg font-semibold text-foreground">
						{retailer.firstName} {retailer.lastName}
					</h2>
					<p className="text-sm text-muted-foreground">{retailer.BusinessName}</p>

					<Separator className="my-5" />

					<div className="flex flex-col gap-2 text-left text-sm text-foreground/80">
						<p className="flex items-center gap-2">
							<Mail className="size-4 shrink-0 text-muted-foreground" /> {retailer.email}
						</p>
						<p className="flex items-center gap-2">
							<Phone className="size-4 shrink-0 text-muted-foreground" /> {retailer.phone}
						</p>
						<p className="flex items-center gap-2">
							<MapPin className="size-4 shrink-0 text-muted-foreground" /> ZipCode - {retailer.zipCode}
						</p>
					</div>
				</Card>

				<div>
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="mb-6 h-auto flex-wrap">
							{tabs.map((tab) => (
								<TabsTrigger key={tab.name} value={tab.name}>
									<tab.icon data-icon="inline-start" />
									{tab.name}
								</TabsTrigger>
							))}
						</TabsList>
						<TabsContent value={activeTab}>{renderContent()}</TabsContent>
					</Tabs>
				</div>
			</div>
		</DashboardShell>
	);
};

export default RetailerFullDetails;
