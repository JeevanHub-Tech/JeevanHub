import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Truck, RefreshCw } from "lucide-react";

import { BACKEND_URL } from "../../config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DelhiveryConnectPanel from "../../components/shipping/DelhiveryConnectPanel";
import WarehouseSetupPanel from "../../components/shipping/WarehouseSetupPanel";
import { DELHIVERY_METHOD_LABELS } from "../../components/shipping/delhiveryOptions";

export default function ShippingSettingsPanel({ retailerId, token }) {
	const [status, setStatus] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const fetchStatus = useCallback(async (background = false) => {
		if (!retailerId || !token) return;
		if (!background) setLoading(true);
		setError("");
		try {
			const response = await axios.get(
				`${BACKEND_URL}/api/retailers/${retailerId}/shipping-integration/status`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			const delhivery = response.data?.delhivery || { isConfigured: false, method: null };
			setStatus(delhivery);
		} catch (err) {
			setError(err.response?.data?.message || err.message || "Could not check your Delhivery connection.");
		} finally {
			setLoading(false);
		}
	}, [retailerId, token]);

	useEffect(() => {
		fetchStatus();
	}, [fetchStatus]);

	const connected = Boolean(status?.isConfigured);

	if (loading) {
		return (
			<Card className="p-6 text-center">
				<Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
				<p className="mt-2 text-sm text-muted-foreground">Loading shipping settings...</p>
			</Card>
		);
	}

	return (
		<Card className="overflow-hidden">
			<CardHeader className="bg-muted/30 border-b border-border pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Truck className="size-5 text-primary" />
						Shipping & Logistics
					</CardTitle>
					<Button variant="ghost" size="sm" onClick={fetchStatus}>
						<RefreshCw className="mr-2 size-4" />
						Refresh
					</Button>
				</div>
				<p className="text-sm text-muted-foreground">
					Configure your delivery partners and pickup warehouse here to enable automatic shipping rates and automated AWB generation at checkout.
				</p>
			</CardHeader>
			<CardContent className="p-6 flex flex-col gap-8">
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className="flex flex-col gap-4">
					<h3 className="font-semibold text-foreground">1. Delivery Partner Integration</h3>
					{!connected ? (
						<p className="text-sm text-muted-foreground mb-2">
							Connect to Delhivery to enable automated shipments and live order tracking.
						</p>
					) : (
						<div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-4 text-sm text-success-foreground">
							Delhivery integration is <strong>connected</strong> via 
							<span className="font-semibold bg-success/20 px-2 py-0.5 rounded-md">
								{DELHIVERY_METHOD_LABELS[status.method] || status.method}
							</span>
						</div>
					)}
					<DelhiveryConnectPanel 
						retailerId={retailerId} 
						token={token} 
						status={status}
						onConnected={() => fetchStatus(true)} 
					/>
				</div>

				{connected && (
					<div className="flex flex-col gap-4 border-t border-border pt-6">
						<h3 className="font-semibold text-foreground">2. Pickup Warehouse Configuration</h3>
						<p className="text-sm text-muted-foreground mb-2">
							Delhivery needs to know where to pick up your packages. Enter your warehouse details exactly as registered in your Delhivery dashboard.
						</p>
						<div className="rounded-lg border border-border p-4 bg-card">
							<WarehouseSetupPanel 
								retailerId={retailerId} 
								token={token} 
								onSaved={() => fetchStatus()}
							/>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
