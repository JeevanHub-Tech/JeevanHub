import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle2, Loader2, Truck, Download, Calendar } from "lucide-react";

import { BACKEND_URL } from "../../config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import DelhiveryConnectPanel from "./DelhiveryConnectPanel";
import WarehouseSetupPanel from "./WarehouseSetupPanel";
import { DELHIVERY_METHOD_LABELS } from "./delhiveryOptions";

const PARTNERS = [
	{ id: "delhivery", name: "Delhivery", note: "Live tracking, delivery confirmed by the courier", available: true },
	{ id: "bluedart", name: "Blue Dart", note: "Coming soon", available: false },
	{ id: "dtdc", name: "DTDC", note: "Coming soon", available: false },
];

function ShipOrderDialog({ open, onOpenChange, order, retailerId, token, onShipped }) {
	const [partner, setPartner] = useState("delhivery");
	const [status, setStatus] = useState(null);
	const [loadingStatus, setLoadingStatus] = useState(false);
	const [statusError, setStatusError] = useState("");
	const [showConnect, setShowConnect] = useState(false);

	const [warehouse, setWarehouse] = useState(null);
	const [warehouseOk, setWarehouseOk] = useState(false);

	const [shipMode, setShipMode] = useState("auto");
	const [awb, setAwb] = useState("");
	const [shipping, setShipping] = useState(false);
	const [shipError, setShipError] = useState("");
	const [shipped, setShipped] = useState(null);
	const [pickupDate, setPickupDate] = useState("");
	const [pickupRequested, setPickupRequested] = useState(false);

	const fetchStatus = useCallback(async () => {
		if (!retailerId || !token) return;
		setLoadingStatus(true);
		setStatusError("");
		try {
			const response = await axios.get(
				`${BACKEND_URL}/api/retailers/${retailerId}/shipping-integration/status`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			const delhivery = response.data?.delhivery || { isConfigured: false, method: null };
			setStatus(delhivery);
			setShowConnect(!delhivery.isConfigured);
		} catch (err) {
			setStatusError(err.response?.data?.message || err.message || "Could not check your Delhivery connection.");
		} finally {
			setLoadingStatus(false);
		}
	}, [retailerId, token]);

	useEffect(() => {
		if (!open) return;
		setPartner("delhivery");
		setAwb("");
		setShipError("");
		setShipped(null);
		setShipMode("auto");
		setPickupRequested(false);
		fetchStatus();
	}, [open, fetchStatus]);

	const connected = Boolean(status?.isConfigured);
	const webhookOnly = status?.method === "webhook";
	const sandbox = status?.sandbox === true;

	const handleWarehouseSaved = (wh) => {
		setWarehouse(wh);
		setWarehouseOk(true);
	};

	const submitShipment = async (e) => {
		e.preventDefault();
		setShipping(true);
		setShipError("");
		try {
			if (shipMode === "auto") {
				const response = await axios.post(
					`${BACKEND_URL}/api/shipping/orders/${order._id}/create-shipment`,
					{ platform: partner },
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setAwb(response.data?.awb || "");
				setShipped(response.data?.order || { orderStatus: "shipped" });
				onShipped?.(response.data?.order);
			} else {
				const response = await axios.put(
					`${BACKEND_URL}/api/orders/${order._id}/ship`,
					{ platform: partner, trackingId: awb.trim() },
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setShipped(response.data?.order || { orderStatus: "shipped" });
				onShipped?.(response.data?.order);
			}
		} catch (err) {
			setShipError(err.response?.data?.message || err.message || "Could not mark this order as shipped.");
		} finally {
			setShipping(false);
		}
	};

	const downloadLabel = async () => {
		try {
			const res = await axios.get(
				`${BACKEND_URL}/api/shipping/orders/${order._id}/label?retailerId=${retailerId}`,
				{ headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
			);
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `Label_${awb || order._id}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (err) {
			console.error("Failed to download label", err);
		}
	};

	const requestPickup = async () => {
		if (!pickupDate) return;
		try {
			await axios.post(
				`${BACKEND_URL}/api/shipping/orders/${order._id}/request-pickup`,
				{ retailerId, pickupDate, pickupTime: "10:00:00" },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setPickupRequested(true);
		} catch (err) {
			console.error("Failed to request pickup", err);
			alert("Failed to request pickup: " + (err.response?.data?.message || err.message));
		}
	};

	const showWarehouseSetup = connected && !showConnect;
	const canProceedToShip = connected && warehouseOk;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Truck className="size-4 text-primary" />
						Ship order
						{order?._id ? <span className="text-sm text-muted-foreground">#{String(order._id).slice(-6)}</span> : null}
					</DialogTitle>
					<DialogDescription>
						{order?.customerName ? `For ${order.customerName}. ` : ""}
						Attach the courier waybill so the patient can follow the parcel and delivery is confirmed by the courier, not by hand.
					</DialogDescription>
				</DialogHeader>

				{shipped ? (
					<div className="flex flex-col gap-4">
						<Alert>
							<CheckCircle2 />
							<AlertTitle>Marked as shipped</AlertTitle>
							<AlertDescription>
								AWB <strong className="text-foreground">{awb || (shipped.shipments && shipped.shipments.length > 0 && shipped.shipments[shipped.shipments.length - 1].trackingId) || "attached"}</strong> is attached.
								{webhookOnly
									? " Delhivery will push each scan to JeevanHub, so the timeline fills in as the parcel moves."
									: " The patient can now watch the live timeline, and delivery will be picked up automatically."}
							</AlertDescription>
						</Alert>
						
						{shipMode === "auto" && (
							<div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20">
								<p className="font-medium">Next Steps</p>
								<div className="flex flex-wrap gap-2">
									<Button type="button" variant="outline" onClick={downloadLabel}>
										<Download className="mr-2 size-4" />
										Download Label
									</Button>
								</div>
								
								<Separator className="my-2" />
								
								<div className="flex flex-col gap-2">
									<p className="text-sm font-medium">Request Pickup</p>
									{pickupRequested ? (
										<Alert className="bg-success/10 border-success/20 text-success-foreground">
											<CheckCircle2 className="text-success" />
											<AlertDescription>Pickup requested successfully for {pickupDate}</AlertDescription>
										</Alert>
									) : (
										<div className="flex items-center gap-2">
											<Input 
												type="date" 
												value={pickupDate} 
												onChange={(e) => setPickupDate(e.target.value)}
												className="max-w-[200px]"
												min={new Date().toISOString().split('T')[0]}
											/>
											<Button type="button" onClick={requestPickup} disabled={!pickupDate}>
												<Calendar className="mr-2 size-4" />
												Request Pickup
											</Button>
										</div>
									)}
								</div>
							</div>
						)}

						<DialogFooter>
							<Button type="button" onClick={() => onOpenChange(false)}>
								Done
							</Button>
						</DialogFooter>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{/* ---- Step 1: delivery partner ---- */}
						<div className="flex flex-col gap-2">
							<p className="text-sm font-medium text-foreground">1. Delivery partner</p>
							<div className="grid gap-2 sm:grid-cols-3">
								{PARTNERS.map((p) => (
									<button
										key={p.id}
										type="button"
										disabled={!p.available}
										onClick={() => setPartner(p.id)}
										className={`flex cursor-pointer flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
											partner === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
										}`}
									>
										<span className="text-sm font-medium text-foreground">{p.name}</span>
										<span className="text-xs text-muted-foreground">{p.note}</span>
									</button>
								))}
							</div>
						</div>

						<Separator />

						{/* ---- Step 2: how status reaches us ---- */}
						<div className="flex flex-col gap-2">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-sm font-medium text-foreground">2. Connect Credentials</p>
								{connected && !showConnect ? (
									<Button type="button" size="sm" variant="ghost" onClick={() => setShowConnect(true)}>
										Change method
									</Button>
								) : null}
							</div>

							{loadingStatus ? (
								<p className="flex items-center gap-2 text-sm text-muted-foreground">
									<Loader2 className="size-4 animate-spin" />
									Checking your Delhivery connection...
								</p>
							) : statusError ? (
								<Alert variant="destructive">
									<AlertCircle />
									<AlertTitle>Could not check your connection</AlertTitle>
									<AlertDescription>
										{statusError}{" "}
										<button type="button" className="underline" onClick={fetchStatus}>
											Try again
										</button>
									</AlertDescription>
								</Alert>
							) : connected && !showConnect ? (
								<div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
									<Badge variant="success">Connected</Badge>
									{sandbox ? <Badge variant="warning">Sandbox — not verified</Badge> : null}
									<span className="text-sm text-foreground">
										{DELHIVERY_METHOD_LABELS[status.method] || status.method}
									</span>
									{status.configuredAt ? (
										<span className="text-xs text-muted-foreground">
											since {new Date(status.configuredAt).toLocaleDateString()}
										</span>
									) : null}
								</div>
							) : (
								<DelhiveryConnectPanel
									retailerId={retailerId}
									token={token}
									status={status}
									onConnected={(next) => {
										setStatus(next);
										if (next?.isConfigured && next.method !== "webhook") setShowConnect(false);
									}}
								/>
							)}
						</div>

						{/* ---- Step 2b: Warehouse Setup ---- */}
						{showWarehouseSetup && (
							<>
								<Separator />
								<div className="flex flex-col gap-2">
									<p className="text-sm font-medium text-foreground">Pickup Location</p>
									<WarehouseSetupPanel 
										retailerId={retailerId} 
										token={token} 
										onSaved={handleWarehouseSaved}
										onLoaded={handleWarehouseSaved}
									/>
								</div>
							</>
						)}

						<Separator />

						{/* ---- Step 3 & 4: the waybill & execute ---- */}
						<form className="flex flex-col gap-4" onSubmit={submitShipment}>
							<div className="flex flex-col gap-2">
								<p className="text-sm font-medium text-foreground">3. Choose Shipment Mode</p>
								<div className="grid gap-2 sm:grid-cols-2">
									<button
										type="button"
										onClick={() => setShipMode("auto")}
										className={`flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
											shipMode === "auto" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
										}`}
									>
										<div className="flex items-center gap-2">
											<div className={`flex h-4 w-4 items-center justify-center rounded-full border ${shipMode === "auto" ? "border-primary" : "border-muted-foreground"}`}>
												{shipMode === "auto" && <div className="h-2 w-2 rounded-full bg-primary" />}
											</div>
											<span className="text-sm font-medium text-foreground">Auto-create shipment (recommended)</span>
										</div>
										<span className="text-xs text-muted-foreground ml-6">JeevanHub creates the shipment in Delhivery and generates an AWB automatically.</span>
									</button>

									<button
										type="button"
										onClick={() => setShipMode("manual")}
										className={`flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
											shipMode === "manual" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
										}`}
									>
										<div className="flex items-center gap-2">
											<div className={`flex h-4 w-4 items-center justify-center rounded-full border ${shipMode === "manual" ? "border-primary" : "border-muted-foreground"}`}>
												{shipMode === "manual" && <div className="h-2 w-2 rounded-full bg-primary" />}
											</div>
											<span className="text-sm font-medium text-foreground">Enter AWB manually</span>
										</div>
										<span className="text-xs text-muted-foreground ml-6">You already created the shipment in your Delhivery dashboard and have the AWB.</span>
									</button>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								{shipMode === "manual" && (
									<>
										<Label htmlFor="jh-awb" className="text-xs text-muted-foreground">
											From the Delhivery shipping label or your Delhivery One order list.
										</Label>
										<Input
											id="jh-awb"
											autoComplete="off"
											placeholder="e.g. 1234567890123"
											value={awb}
											onChange={(e) => setAwb(e.target.value)}
											disabled={!canProceedToShip}
										/>
										{!canProceedToShip ? (
											<p className="text-xs text-muted-foreground">Connect Delhivery and setup warehouse above first.</p>
										) : sandbox ? (
											<p className="text-xs text-muted-foreground">
												<strong className="text-foreground">Sandbox mode:</strong> nothing is sent to Delhivery. The AWB you type picks
												the scenario — include <code className="font-mono">DL</code> for delivered,{" "}
												<code className="font-mono">RT</code> for a return, <code className="font-mono">UD</code> for a failed attempt,{" "}
												<code className="font-mono">BAD</code> to test rejection. Anything else is in transit.
											</p>
										) : webhookOnly ? (
											<p className="text-xs text-muted-foreground">
												On the webhook method the AWB cannot be verified up front — double-check it against the label.
											</p>
										) : (
											<p className="text-xs text-muted-foreground">
												JeevanHub checks this waybill with Delhivery before saving, so a typo is caught now.
											</p>
										)}
									</>
								)}

								{shipError ? (
									<Alert variant="destructive">
										<AlertCircle />
										<AlertTitle>Could not ship</AlertTitle>
										<AlertDescription>{shipError}</AlertDescription>
									</Alert>
								) : null}

								<DialogFooter className="mt-4">
									<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
										Cancel
									</Button>
									{shipMode === "auto" ? (
										<Button type="submit" loading={shipping ? "true" : undefined} disabled={!canProceedToShip || shipping}>
											Create Shipment & Ship
										</Button>
									) : (
										<Button type="submit" loading={shipping ? "true" : undefined} disabled={!canProceedToShip || awb.trim().length < 5 || shipping}>
											Mark as shipped
										</Button>
									)}
								</DialogFooter>
							</div>
						</form>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

export default ShipOrderDialog;
