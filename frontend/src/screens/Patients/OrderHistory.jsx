import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, PackageSearch, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AuthContext } from "../../context/AuthContext";
import { BACKEND_URL } from "../../config";

const API_BASE_URL = `${BACKEND_URL}`;
const FALLBACK_IMAGE =
	"https://images.unsplash.com/photo-1638310526160-ce17611bffff?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const STATUS_VARIANTS = {
	pending: "warning",
	shipped: "default",
	delivered: "success",
	cancelled: "destructive",
};

const OrderHistory = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const { auth } = useContext(AuthContext);
	const userId = auth?.user?.id;
	const navigate = useNavigate();

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				setLoading(true);
				const response = await axios.get(`${API_BASE_URL}/api/orders/getOrdersByBuyerId/${userId}`, {
					headers: { Authorization: `Bearer ${auth.token}` },
				});
				setOrders(response.data.orders || []);
				setLoading(false);
			} catch (error) {
				if (error.response?.status === 404) {
					// No orders yet -- not a failure, just an empty list.
					setOrders([]);
				} else {
					console.error("Error fetching orders:", error);
					setError("Failed to load your orders. Please try again later.");
				}
				setLoading(false);
			}
		};

		if (userId) fetchOrders();
	}, [userId, auth.token]);

	const formatDate = (dateString) =>
		new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

	const getImageUrl = (imagePath) => {
		if (!imagePath) return FALLBACK_IMAGE;
		if (imagePath.startsWith("http")) return imagePath;
		if (imagePath.startsWith("/")) return `${API_BASE_URL}${imagePath}`;
		return `${API_BASE_URL}/${imagePath}`;
	};

	return (
		<main className="bg-background">
			<div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
				<h1 className="font-display text-3xl text-foreground sm:text-4xl">Your orders</h1>
				{!loading && !error && orders.length > 0 ? (
					<p className="mt-1 text-sm text-muted-foreground">
						{orders.length} order{orders.length === 1 ? "" : "s"} placed
					</p>
				) : null}

				{loading ? (
					<div className="mt-10 flex flex-col items-center gap-3 py-16 text-muted-foreground">
						<Loader2 className="size-8 animate-spin" />
						<p>Loading your orders...</p>
					</div>
				) : error ? (
					<div className="mt-10 flex flex-col items-center gap-3 py-16 text-destructive">
						<AlertCircle className="size-8" />
						<p>{error}</p>
					</div>
				) : orders.length === 0 ? (
					<div className="mt-10">
						<EmptyState
							icon={PackageSearch}
							title="No orders yet"
							description="Medicines you order will show up here so you can track them from purchase to delivery."
							action={<Button onClick={() => navigate("/medicines")}>Shop now</Button>}
						/>
					</div>
				) : (
					<div className="mt-6 flex flex-col gap-5">
						{orders.map((order) => (
							<Card key={order._id}>
								<CardContent className="flex flex-col gap-4">
									<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
										<div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
											<div>
												<p className="text-xs text-muted-foreground">Order placed</p>
												<p className="font-medium text-foreground">{formatDate(order.createdAt)}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">Total</p>
												<p className="font-medium text-foreground">₹{(Number(order.totalPrice) || 0).toFixed(2)}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">Order #</p>
												<p className="font-medium text-foreground">{order._id.slice(-6)}</p>
											</div>
										</div>
										<Badge variant={STATUS_VARIANTS[order.orderStatus?.toLowerCase()] || "secondary"}>
											{order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
										</Badge>
									</div>

									{order.retailers?.length > 0 ? (
										<p className="text-sm text-muted-foreground">Sold by {order.retailers.join(", ")}</p>
									) : null}

									<ul className="flex flex-col gap-3">
										{order.items.map((item, index) => {
											const medicineImage = item.medicineId?.images?.[0];
											return (
												<li key={index} className="flex items-center gap-3">
													<img
														src={medicineImage ? getImageUrl(medicineImage) : FALLBACK_IMAGE}
														alt={item.medicineId?.name}
														onError={(e) => {
															e.target.onerror = null;
															e.target.src = FALLBACK_IMAGE;
														}}
														className="size-14 shrink-0 rounded-(--jh-radius-md) object-cover"
													/>
													<div className="min-w-0 flex-1">
														<p className="truncate text-sm font-medium text-foreground">{item.medicineId?.name}</p>
														<p className="text-xs text-muted-foreground">
															₹{(Number(item.medicineId?.price) || 0).toFixed(2)} × {item.quantity}
														</p>
													</div>
													<p className="shrink-0 text-sm font-semibold text-foreground">
														₹{(Number(item.subTotal) || 0).toFixed(2)}
													</p>
												</li>
											);
										})}
									</ul>

									{order.orderStatus.toLowerCase() === "delivered" && order.review ? (
										<div className="rounded-(--jh-radius-md) bg-secondary/60 p-3">
											<h4 className="text-xs font-semibold text-muted-foreground">Your feedback</h4>
											<div className="mt-1 flex gap-0.5">
												{[1, 2, 3, 4, 5].map((i) => (
													<Star
														key={i}
														size={16}
														className={
															i <= order.review.rating
																? "fill-(--jh-turmeric-gold) text-(--jh-turmeric-gold)"
																: "text-border"
														}
													/>
												))}
											</div>
											{order.review.comment ? <p className="mt-1 text-sm text-foreground">{order.review.comment}</p> : null}
											{order.review.deliveredAt ? (
												<p className="mt-1 text-xs text-muted-foreground">
													Delivered on {new Date(order.review.deliveredAt).toLocaleDateString()}
												</p>
											) : null}
										</div>
									) : null}

									<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
										<div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
											<p>
												Payment method: {order.paymentMethod === "cashOnDelivery" ? "Cash on delivery" : "Online payment"}
											</p>
											<p>Payment status: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
										</div>

										{order.orderStatus.toLowerCase() === "shipped" ? (
											<Button size="sm" onClick={() => navigate(`/BuyerFeedback/${order._id}`)}>
												Update order status
											</Button>
										) : null}

										{order.orderStatus.toLowerCase() === "delivered" ? (
											<Button size="sm" variant="outline" onClick={() => navigate(`/BuyerFeedback/${order._id}`)}>
												Update feedback
											</Button>
										) : null}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</main>
	);
};

export default OrderHistory;
