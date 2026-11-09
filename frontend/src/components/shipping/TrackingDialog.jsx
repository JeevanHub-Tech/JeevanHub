import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";

import { BACKEND_URL } from "../../config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import TrackingTimeline from "./TrackingTimeline";

const DELHIVERY_PUBLIC_TRACKING = "https://www.delhivery.com/track/package/";

const STATUS_BADGE = {
	delivered: "success",
	cancelled: "destructive",
	shipped: "default",
};

/**
 * Read-only shipment tracking, shared by the patient's order history and the
 * retailer's order list. Fetching is a GET, but it is also what triggers a
 * re-poll of Delhivery server-side, so a manual Refresh is offered.
 */
function TrackingDialog({ open, onOpenChange, orderId, retailerId, token }) {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);

	const fetchTracking = useCallback(async () => {
		if (!orderId || !token) return;
		setLoading(true);
		setError("");
		try {
			const url = retailerId 
				? `${BACKEND_URL}/api/orders/${orderId}/tracking?retailerId=${retailerId}`
				: `${BACKEND_URL}/api/orders/${orderId}/tracking`;
			const response = await axios.get(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			// Response format can be single or multiple shipments. If multiple, assume single for now or handle appropriately. 
			// Backend returns { trackingId, orderStatus, ... } for specific retailer, or array. The backend says if retailerId is specific, it returns tracking for that specific shipment.
			// Actually the task says "The response should still have trackingId, orderStatus..." so we can assume it returns the single object if retailerId is provided, or we can handle an array if needed. But the prompt says "returns tracking for that specific shipment; if omitted, returns all shipments. The response format may have changed — read the response and adapt the rendering accordingly. The response should still have trackingId, orderStatus, currentStatus..."
			// Wait, the prompt says "The response should still have trackingId, orderStatus, currentStatus, currentLocation, lastUpdated, timeline." So if it returns an array when retailerId is omitted, we should render the array, but in this task we always pass retailerId in MyOrders and OrderHistory! Wait, in OrderHistory, order.shipments is iterated, so we will pass specific retailerId to Track!
			setData(response.data);
		} catch (err) {
			setError(err.response?.data?.message || err.message || "Could not load tracking.");
		} finally {
			setLoading(false);
		}
	}, [orderId, retailerId, token]);

	useEffect(() => {
		if (!open) return;
		setData(null);
		fetchTracking();
	}, [open, fetchTracking]);

	const copyAwb = async (awb) => {
		if (!awb) return;
		try {
			if (navigator?.clipboard?.writeText) {
				await navigator.clipboard.writeText(awb);
			} else {
				throw new Error("Clipboard API unavailable");
			}
		} catch {
			const el = document.createElement("textarea");
			el.value = awb;
			el.setAttribute("readonly", "");
			el.style.position = "absolute";
			el.style.left = "-9999px";
			document.body.appendChild(el);
			el.select();
			document.execCommand("copy");
			document.body.removeChild(el);
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const CARRIER_URLS = {
		delhivery: (awb) => `https://www.delhivery.com/track/package/${encodeURIComponent(awb || "")}`,
		bluedart: () => `https://www.bluedart.com/tracking`,
		dtdc: () => `https://www.dtdc.in/`
	};

	const CARRIER_LABELS = {
		delhivery: "Delhivery",
		bluedart: "Blue Dart",
		dtdc: "DTDC"
	};

	const renderTrackingData = (trackingData) => {
		const awb = trackingData.trackingId || trackingData.shipment?.trackingId;
		const orderStatus = trackingData.orderStatus || trackingData.shipment?.lastPolledStatus || "shipped";
		const currentStatus = trackingData.currentStatus || trackingData.lastPolledStatus || trackingData.shipment?.lastPolledStatus || orderStatus;
		const currentLocation = trackingData.currentLocation || trackingData.lastPolledLocation || trackingData.shipment?.lastPolledLocation;
		const timeline = trackingData.timeline || trackingData.trackingTimeline || trackingData.shipment?.trackingTimeline || [];
		const platform = (trackingData.platform || trackingData.shipment?.platform || "delhivery").toLowerCase();
		const platformLabel = CARRIER_LABELS[platform] || "Courier";
		const carrierUrl = (CARRIER_URLS[platform] || CARRIER_URLS.delhivery)(awb);
		const isSandboxAwb = Boolean(awb && (awb.startsWith("SBX") || awb.includes("SANDBOX")));

		return (
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant={STATUS_BADGE[orderStatus] || "secondary"}>
							{currentStatus}
						</Badge>
						{isSandboxAwb && (
							<Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] py-0 px-1.5">
								Sandbox Simulated
							</Badge>
						)}
						{currentLocation ? (
							<span className="text-xs text-muted-foreground">at {currentLocation}</span>
						) : null}
					</div>

					{awb ? (
						<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
							<span>
								AWB <span className="font-mono font-medium text-foreground">{awb}</span>
							</span>
							<Button type="button" size="sm" variant="ghost" className="h-6 px-1.5 text-xs gap-1" onClick={() => copyAwb(awb)} aria-label="Copy AWB">
								<Copy className="size-3" />
								<span>{copied ? "Copied!" : "Copy"}</span>
							</Button>
							{isSandboxAwb ? (
								<span
									className="inline-flex items-center gap-1 text-muted-foreground/70 cursor-help"
									title="External courier tracking is unavailable for sandbox test waybills (SBX-...) because simulated numbers do not exist on Delhivery's live public portal."
								>
									{platformLabel} site
									<span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border text-muted-foreground">
										Mock AWB (404 on live site)
									</span>
								</span>
							) : (
								<a
									href={carrierUrl}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1 underline text-primary hover:text-foreground"
									title={`Track on ${platformLabel}`}
								>
									{platformLabel} site
									<ExternalLink className="size-3" />
								</a>
							)}
						</div>
					) : null}

					<div className="flex flex-wrap items-center justify-between gap-2">
						<span className="text-xs text-muted-foreground">
							{trackingData.lastUpdated || trackingData.shipment?.lastPolledAt
								? `Updated ${new Date(trackingData.lastUpdated || trackingData.shipment.lastPolledAt).toLocaleString("en-IN")}`
								: "Not polled yet"}
							{trackingData.source === "cached" ? " (cached)" : ""}
						</span>
						<Button type="button" size="sm" variant="outline" loading={loading ? "true" : undefined} onClick={fetchTracking}>
							<RefreshCw className="mr-2 size-3.5" />
							Refresh
						</Button>
					</div>
				</div>

				{trackingData.error ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertTitle>Showing the last known update</AlertTitle>
						<AlertDescription>{trackingData.error}</AlertDescription>
					</Alert>
				) : null}

				<Separator />
				<TrackingTimeline timeline={timeline} />
			</div>
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Track shipment</DialogTitle>
					<DialogDescription>
						{Array.isArray(data) ? "Courier updates for your order shipments." : (data?.trackingId ? "Live from Delhivery." : "Courier updates for this order.")}
					</DialogDescription>
				</DialogHeader>

				{loading && !data ? (
					<p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
						<Loader2 className="size-4 animate-spin" />
						Fetching the latest scans...
					</p>
				) : error ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertTitle>No tracking available</AlertTitle>
						<AlertDescription>
							{error}{" "}
							<button type="button" className="underline" onClick={fetchTracking}>
								Try again
							</button>
						</AlertDescription>
					</Alert>
				) : data ? (
					Array.isArray(data) ? (
						<div className="flex flex-col gap-6">
							{data.map((shipmentData, idx) => (
								<div key={idx}>
									{idx > 0 && <Separator className="mb-4" />}
									<h4 className="mb-2 font-medium">Shipment {idx + 1}</h4>
									{renderTrackingData(shipmentData)}
								</div>
							))}
						</div>
					) : (
						renderTrackingData(data)
					)
				) : null}
			</DialogContent>
		</Dialog>
	);
}

export default TrackingDialog;
