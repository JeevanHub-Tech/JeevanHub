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
			await navigator.clipboard.writeText(awb);
		} catch {
			const el = document.createElement("textarea");
			el.value = awb;
			document.body.appendChild(el);
			el.select();
			document.execCommand("copy");
			document.body.removeChild(el);
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 1800);
	};

	const renderTrackingData = (trackingData) => {
		return (
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant={STATUS_BADGE[trackingData.orderStatus] || "secondary"}>
							{trackingData.currentStatus || trackingData.orderStatus}
						</Badge>
						{trackingData.currentLocation ? (
							<span className="text-xs text-muted-foreground">at {trackingData.currentLocation}</span>
						) : null}
					</div>

					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<span>
							AWB <span className="font-mono text-foreground">{trackingData.trackingId}</span>
						</span>
						<Button type="button" size="icon-xs" variant="ghost" onClick={() => copyAwb(trackingData.trackingId)} aria-label="Copy AWB">
							<Copy className="size-3" />
						</Button>
						{copied ? <span>Copied</span> : null}
						<a
							href={`${DELHIVERY_PUBLIC_TRACKING}${encodeURIComponent(trackingData.trackingId)}`}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 underline hover:text-foreground"
						>
							Delhivery site
							<ExternalLink className="size-3" />
						</a>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2">
						<span className="text-xs text-muted-foreground">
							{trackingData.lastUpdated
								? `Updated ${new Date(trackingData.lastUpdated).toLocaleString("en-IN")}`
								: "Not polled yet"}
							{trackingData.source === "cached" ? " (cached)" : ""}
						</span>
						<Button type="button" size="sm" variant="outline" loading={loading} onClick={fetchTracking}>
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
				<TrackingTimeline timeline={trackingData.timeline} />
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
