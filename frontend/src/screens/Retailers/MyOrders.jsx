import { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Truck, FileText, Package, XCircle } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import ShipOrderDialog from "@/components/shipping/ShipOrderDialog";
import TrackingDialog from "@/components/shipping/TrackingDialog";
import { formatDate } from "@/lib/date";

function MyOrders() {
	const { t } = useTranslation();
	const [orders, setOrders] = useState([]);
	const [status, setStatus] = useState("pending");
	const [shipOrder, setShipOrder] = useState(null);
	const [trackOrderId, setTrackOrderId] = useState(null);
	const [showPickupPicker, setShowPickupPicker] = useState(null);
	const [pickupDate, setPickupDate] = useState("");
	const { auth } = useContext(AuthContext);
	const retailerId = auth?.user?.id;

	const statusTabs = [
		{ value: "pending", label: t("retailerOrders.tabs.pending", "Received") },
		{ value: "accepted", label: t("retailerOrders.tabs.accepted", "Accepted") },
		{ value: "delivered", label: t("retailerOrders.tabs.delivered", "Delivered") },
		{ value: "shipped", label: t("retailerOrders.tabs.shipped", "Shipped") },
		{ value: "rejected", label: t("retailerOrders.tabs.rejected", "Rejected") },
	];

	// Lifted out of the effect so the ship dialog can refetch after attaching an AWB.
	const fetchOrders = useCallback(async () => {
		if (!retailerId) return;
		try {
			const response = await axios.get(`${BACKEND_URL}/api/orders/getOrdersByRetailerId/${retailerId}`, {
				headers: { Authorization: `Bearer ${auth.token}` },
			});

			setOrders(response.data.orders || []);
		} catch (error) {
			console.error("Error fetching orders:", error);
		}
	}, [retailerId, auth.token]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const updateOrderStatus = async (orderId, newStatus) => {
		try {
			await axios.put(
				`${BACKEND_URL}/api/orders/status`,
				{
					orderId,
					status: newStatus,
				},
				{
					headers: { Authorization: `Bearer ${auth.token}` },
				}
			);
			setOrders((prevOrders) => prevOrders.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order)));
		} catch (error) {
			console.error("Error updating order status:", error);
		}
	};

	const downloadLabel = async (orderId) => {
		try {
			const res = await axios.get(`${BACKEND_URL}/api/shipping/orders/${orderId}/label?retailerId=${retailerId}`, {
				headers: { Authorization: `Bearer ${auth.token}` },
				responseType: 'blob'
			});
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `label-${orderId}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (error) {
			console.error("Error downloading label:", error);
		}
	};

	const cancelShipment = async (orderId) => {
		try {
			await axios.post(`${BACKEND_URL}/api/shipping/orders/${orderId}/cancel-shipment`, { retailerId }, {
				headers: { Authorization: `Bearer ${auth.token}` }
			});
			fetchOrders();
		} catch (error) {
			console.error("Error cancelling shipment:", error);
		}
	};

	const submitPickup = async (orderId) => {
		if (!pickupDate) return;
		try {
			await axios.post(`${BACKEND_URL}/api/shipping/orders/${orderId}/request-pickup`, { retailerId, pickupDate }, {
				headers: { Authorization: `Bearer ${auth.token}` }
			});
			setShowPickupPicker(null);
			setPickupDate("");
			fetchOrders();
		} catch (error) {
			console.error("Error requesting pickup:", error);
		}
	};

	const filteredOrders = orders.filter((order) => order.status === status);

	return (
		<DashboardShell>
			<DashboardPageHeader title={t("retailerOrders.title", "My Orders")} />

			<Tabs value={status} onValueChange={setStatus}>
				<TabsList className="mb-6 h-auto flex-wrap">
					{statusTabs.map((tab) => (
						<TabsTrigger key={tab.value} value={tab.value}>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{filteredOrders.length === 0 ? (
				<p className="mt-10 text-center text-lg text-muted-foreground">
					{t("retailerOrders.noOrders", "No orders found in the {{status}} category.", { status })}
				</p>
			) : (
				<div className="flex flex-col gap-6">
					{filteredOrders.map((order) => {
						const shipment = order.shipments?.find(s => s.retailerId === retailerId);

						return (
							<Card key={order._id} className="p-6 transition-transform hover:-translate-y-1">
								<p className="mb-2">
									<strong className="text-foreground">{t("retailerOrders.buyerName", "Buyer Name:")}</strong> {order.customerName}
								</p>
								<p className="mb-2">
									<strong className="text-foreground">{t("retailerOrders.orderDate", "Order Receiving Date:")}</strong> {formatDate(order.date)}
								</p>
								<p className="mb-2">
									<strong className="text-foreground">{t("retailerOrders.shippingAddress", "Shipping Address:")}</strong>{" "}
									{order.shippingAddress
										? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`
										: "N/A"}
								</p>
								<p className="mb-2">
									<strong className="text-foreground">{t("retailerOrders.items", "Items:")}</strong>
								</p>

								<div className="mb-3 overflow-x-auto rounded-lg border border-border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>{t("retailerOrders.table.medicine", "Medicine")}</TableHead>
												<TableHead>{t("retailerOrders.table.unitPrice", "Unit Price")}</TableHead>
												<TableHead>{t("retailerOrders.table.quantity", "Quantity")}</TableHead>
												<TableHead>{t("retailerOrders.table.subtotal", "Subtotal")}</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{order.items.map((item, idx) => (
												<TableRow key={idx}>
													<TableCell>{item.medicineName}</TableCell>
													<TableCell>{item.unitPrice}</TableCell>
													<TableCell>{item.quantity}</TableCell>
													<TableCell>{item.subTotal}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

								<p className="mb-2">
									<strong className="text-foreground">{t("retailerOrders.orderTotal", "Order Total:")}</strong> {order.orderTotal}
								</p>
								<p>
									<strong className="text-foreground">{t("retailerOrders.statusLabel", "Status:")}</strong> {order.status}
								</p>

								{shipment?.trackingId ? (
									<div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
										<div className="flex flex-wrap items-center gap-2">
											<Truck className="size-4 text-primary" />
											<span className="text-sm text-foreground">
												Delhivery AWB <span className="font-mono">{shipment.trackingId}</span>
											</span>
											{shipment.lastPolledStatus ? (
												<Badge variant="secondary">{shipment.lastPolledStatus}</Badge>
											) : null}
											<Button size="sm" variant="outline" onClick={() => setTrackOrderId(order._id)}>
												{t("retailerOrders.actions.track", "Track")}
											</Button>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Button size="sm" variant="outline" onClick={() => downloadLabel(order._id)}>
												<FileText className="mr-2 size-3.5" /> {t("retailerOrders.actions.label", "Label")}
											</Button>

											{!shipment.pickupId ? (
												showPickupPicker === order._id ? (
													<div className="flex items-center gap-2">
														<Input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="h-9 w-auto" />
														<Button size="sm" onClick={() => submitPickup(order._id)}>{t("retailerOrders.actions.submit", "Submit")}</Button>
														<Button size="sm" variant="ghost" onClick={() => setShowPickupPicker(null)}>{t("retailerOrders.actions.cancel", "Cancel")}</Button>
													</div>
												) : (
													<Button size="sm" variant="outline" onClick={() => setShowPickupPicker(order._id)}>
														<Package className="mr-2 size-3.5" /> {t("retailerOrders.actions.requestPickup", "Request Pickup")}
													</Button>
												)
											) : null}

											{shipment.lastPolledStatusCode === 'M' ? (
												<Button size="sm" variant="destructive" onClick={() => cancelShipment(order._id)}>
													<XCircle className="mr-2 size-3.5" /> {t("retailerOrders.actions.cancelShipment", "Cancel Shipment")}
												</Button>
											) : null}
										</div>
									</div>
								) : null}

								{(status === "pending" || status === "accepted") && (
									<div className="mt-5 flex flex-wrap items-center gap-3">
										<span className="text-sm text-muted-foreground">{t("retailerOrders.actions.updateStatus", "Update Status:")}</span>
										{status === "pending" ? (
											<>
												<Button size="sm" onClick={() => updateOrderStatus(order._id, "accepted")}>
													{t("retailerOrders.actions.accept", "Accept")}
												</Button>
												<Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order._id, "rejected")}>
													{t("retailerOrders.actions.reject", "Reject")}
												</Button>
											</>
										) : null}
										{status === "accepted" ? (
											<Button size="sm" onClick={() => setShipOrder(order)}>
												<Truck className="mr-2 size-3.5" />
												{t("retailerOrders.actions.shipOrder", "Ship order")}
											</Button>
										) : null}
									</div>
								)}
							</Card>
						);
					})}
				</div>
			)}

			<ShipOrderDialog
				open={Boolean(shipOrder)}
				onOpenChange={(next) => !next && setShipOrder(null)}
				order={shipOrder || {}}
				retailerId={retailerId}
				token={auth.token}
				onShipped={fetchOrders}
			/>

			<TrackingDialog
				open={Boolean(trackOrderId)}
				onOpenChange={(next) => !next && setTrackOrderId(null)}
				orderId={trackOrderId}
				retailerId={retailerId}
				token={auth.token}
			/>
		</DashboardShell>
	);
}

export default MyOrders;

