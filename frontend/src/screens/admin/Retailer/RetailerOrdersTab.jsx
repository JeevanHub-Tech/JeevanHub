import { useEffect, useState } from "react";
import { Package, CheckCircle2, Truck, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const getStatusBadge = (status) => {
	switch (status.toLowerCase()) {
		case "delivered":
			return { variant: "default", Icon: CheckCircle2 };
		case "shipped":
			return { variant: "secondary", Icon: Truck };
		case "pending":
			return { variant: "destructive", Icon: AlertTriangle };
		default:
			return { variant: "outline", Icon: Package };
	}
};

const fetchRetailerOrders = async (retailerId, setOrders, setLoading, setError) => {
	setLoading(true);
	setError(null);
	try {
		const token = localStorage.getItem("token");
		const response = await authFetch(`${BACKEND_URL}/api/orders/getOrdersByRetailerId/${retailerId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Failed to fetch orders for this retailer.");
		}

		const data = await response.json();
		setOrders(data.orders);
	} catch (error) {
		console.error("Error fetching retailer's orders:", error);
		setError(error.message);
	} finally {
		setLoading(false);
	}
};

const RetailerOrdersTab = ({ retailerId }) => {
	const [, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [orders, setOrders] = useState([]);

	useEffect(() => {
		if (retailerId) {
			fetchRetailerOrders(retailerId, setOrders, setLoading, setError);
		}
	}, [retailerId]);

	if (error) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Package />
					</EmptyMedia>
					<EmptyTitle>No Orders Found</EmptyTitle>
					<EmptyDescription>{error}</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	if (!orders || orders.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Package />
					</EmptyMedia>
					<EmptyTitle>No Orders Found</EmptyTitle>
					<EmptyDescription>This retailer does not have any order history yet.</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div>
			<div className="mb-5">
				<h3 className="text-xl font-semibold text-foreground">Order History</h3>
				<p className="text-sm text-muted-foreground">Showing all {orders.length} orders placed with this retailer.</p>
			</div>
			<div className="overflow-x-auto rounded-lg border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Order ID</TableHead>
							<TableHead>Customer Name</TableHead>
							<TableHead>Medicine</TableHead>
							<TableHead>Order Date</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{orders.map((order) => {
							const { variant, Icon } = getStatusBadge(order.status);
							return (
								<TableRow key={order._id}>
									<TableCell className="font-semibold text-foreground">{order._id}</TableCell>
									<TableCell>{order.customerName}</TableCell>
									<TableCell>
										{order.items.map((item) => `${item.medicineName} X ${item.quantity}`).join(", ")}
									</TableCell>
									<TableCell>{new Date(order.date).toLocaleDateString("en-GB")}</TableCell>
									<TableCell>
										<Badge variant={variant} className="gap-1 capitalize">
											<Icon className="size-3.5" />
											{order.status}
										</Badge>
									</TableCell>
									<TableCell className="font-semibold text-foreground">
										₹{order.orderTotal.toLocaleString("en-IN")}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};

export default RetailerOrdersTab;
