import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2 } from "lucide-react";

import { BACKEND_URL } from "../../config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function WarehouseSetupPanel({ retailerId, token, onSaved, onLoaded }) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	
	const [warehouse, setWarehouse] = useState(null);
	const [isEditing, setIsEditing] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		address: "",
		city: "",
		state: "",
		pincode: "",
		phone: ""
	});

	useEffect(() => {
		if (!retailerId || !token) return;
		
		const fetchWarehouse = async () => {
			setLoading(true);
			try {
				const response = await axios.get(`${BACKEND_URL}/api/retailers/${retailerId}/warehouse`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (response.data?.warehouse && response.data.warehouse.name) {
					setWarehouse(response.data.warehouse);
					setFormData(response.data.warehouse);
					if (onLoaded) onLoaded(response.data.warehouse);
				} else {
					setIsEditing(true);
				}
			} catch (err) {
				// If 404 or similar, just means not set up
				if (err.response?.status === 404) {
					setIsEditing(true);
				} else {
					setError(t("warehouseSetup.fetchError", "Could not load warehouse settings."));
				}
			} finally {
				setLoading(false);
			}
		};
		fetchWarehouse();
	}, [retailerId, token, t]); // Removed onSaved from deps to avoid loop

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError("");
		
		try {
			const response = await axios.put(`${BACKEND_URL}/api/retailers/${retailerId}/warehouse`, formData, {
				headers: { Authorization: `Bearer ${token}` }
			});
			
			const savedWarehouse = response.data?.warehouse || formData;
			setWarehouse(savedWarehouse);
			setIsEditing(false);
			if (onSaved) onSaved(savedWarehouse);
		} catch (err) {
			setError(err.response?.data?.message || t("warehouseSetup.saveError", "Failed to save warehouse settings."));
		} finally {
			setSaving(false);
		}
	};

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	if (loading) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="size-4 animate-spin" />
				{t("warehouseSetup.loading", "Loading warehouse settings...")}
			</div>
		);
	}

	if (!isEditing && warehouse) {
		return (
			<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
				<div className="flex items-start justify-between gap-2">
					<div>
						<p className="text-sm font-medium text-foreground">{warehouse.name}</p>
						<p className="text-xs text-muted-foreground">
							{warehouse.address}, {warehouse.city}, {warehouse.state} {warehouse.pincode}
						</p>
						{warehouse.phone && <p className="text-xs text-muted-foreground">{t("warehouseSetup.phonePrefix", "Ph:")} {warehouse.phone}</p>}
					</div>
					<Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
						{t("warehouseSetup.edit", "Edit")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleSave} className="flex flex-col gap-3 rounded-lg border border-border p-4">
			<p className="text-sm font-medium text-foreground">{t("warehouseSetup.title", "Configure Pickup Warehouse")}</p>
			
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="size-4" />
					<AlertTitle>{t("warehouseSetup.errorTitle", "Error")}</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			
			<div className="grid gap-2">
				<Label htmlFor="jh-wh-name">{t("warehouseSetup.nameLabel", "Warehouse Name *")}</Label>
				<Input
					id="jh-wh-name"
					name="name"
					value={formData.name}
					onChange={handleChange}
					required
					placeholder={t("warehouseSetup.namePlaceholder", "e.g. Main Hub")}
				/>
				<p className="text-[10px] text-muted-foreground">
					{t("warehouseSetup.nameHelp", "Must match the pickup location name registered in your Delhivery dashboard exactly.")}
				</p>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="jh-wh-address">{t("warehouseSetup.addressLabel", "Address")}</Label>
				<Input
					id="jh-wh-address"
					name="address"
					value={formData.address}
					onChange={handleChange}
					placeholder={t("warehouseSetup.addressPlaceholder", "123 Industrial Area")}
				/>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<div className="grid gap-2">
					<Label htmlFor="jh-wh-city">{t("warehouseSetup.cityLabel", "City")}</Label>
					<Input
						id="jh-wh-city"
						name="city"
						value={formData.city}
						onChange={handleChange}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="jh-wh-state">{t("warehouseSetup.stateLabel", "State")}</Label>
					<Input
						id="jh-wh-state"
						name="state"
						value={formData.state}
						onChange={handleChange}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<div className="grid gap-2">
					<Label htmlFor="jh-wh-pincode">{t("warehouseSetup.pincodeLabel", "Pincode *")}</Label>
					<Input
						id="jh-wh-pincode"
						name="pincode"
						value={formData.pincode}
						onChange={handleChange}
						required
						maxLength={6}
						pattern="[0-9]{6}"
						placeholder={t("warehouseSetup.pincodePlaceholder", "6 digits")}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="jh-wh-phone">{t("warehouseSetup.phoneLabel", "Phone")}</Label>
					<Input
						id="jh-wh-phone"
						name="phone"
						value={formData.phone}
						onChange={handleChange}
					/>
				</div>
			</div>

			<div className="flex justify-end gap-2 mt-2">
				{warehouse && (
					<Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
						{t("warehouseSetup.cancel", "Cancel")}
					</Button>
				)}
				<Button type="submit" loading={saving.toString()} disabled={saving || !formData.name || !formData.pincode}>
					{saving ? t("warehouseSetup.saving", "Saving...") : t("warehouseSetup.saveWarehouse", "Save Warehouse")}
				</Button>
			</div>
		</form>
	);
}

export default WarehouseSetupPanel;

