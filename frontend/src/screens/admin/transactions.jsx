import { useState, useEffect, useCallback } from "react";
import { ReceiptText, Search, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const fetchTransactions = async (setTransactions, setLoading, setError) => {
	setLoading(true);
	setError(null);
	try {
		const token = localStorage.getItem("token");
		if (!token) {
			throw new Error("No authentication token found.");
		}

		const response = await authFetch(`${BACKEND_URL}/api/orders/getAllTransactions`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Failed to fetch transactions.");
		}
		const data = await response.json();
		setTransactions(data.transactions || []);
	} catch (error) {
		console.error("Error fetching transactions:", error);
		setError(error.message);
	} finally {
		setLoading(false);
	}
};

const badgeVariant = (type) => {
	switch (type.toLowerCase()) {
		case "patient-doctor":
			return "default";
		case "patient-retailer":
			return "secondary";
		case "doctor-retailer":
			return "outline";
		default:
			return "secondary";
	}
};

const Transactions = () => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [disputedBookings, setDisputedBookings] = useState([]);
	const [disputedOrders, setDisputedOrders] = useState([]);
	const [resolvingId, setResolvingId] = useState(null);

	const fetchDisputes = useCallback(async () => {
		const token = localStorage.getItem("token");
		try {
			const [bookingsRes, ordersRes] = await Promise.all([
				authFetch(`${BACKEND_URL}/api/bookings/payout/queue`, { headers: { Authorization: `Bearer ${token}` } }),
				authFetch(`${BACKEND_URL}/api/orders/payout/queue`, { headers: { Authorization: `Bearer ${token}` } }),
			]);
			const bookingsData = await bookingsRes.json();
			const ordersData = await ordersRes.json();
			setDisputedBookings(bookingsData.disputed || []);
			setDisputedOrders(ordersData.disputed || []);
		} catch (err) {
			console.error("Error fetching payout disputes:", err);
		}
	}, []);

	useEffect(() => {
		fetchTransactions(setTransactions, setLoading, setError);
		fetchDisputes();
	}, [fetchDisputes]);

	const resolveDispute = async (kind, id, resolution) => {
		setResolvingId(id);
		try {
			const token = localStorage.getItem("token");
			const path = kind === "booking" ? "bookings" : "orders";
			const response = await authFetch(`${BACKEND_URL}/api/${path}/${id}/dispute/resolve`, {
				method: "PUT",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ resolution }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || data.message || "Failed to resolve dispute");
			await fetchDisputes();
		} catch (err) {
			alert(err.message || "Failed to resolve dispute");
		} finally {
			setResolvingId(null);
		}
	};

	const filteredTransactions = transactions.filter((tItem) => {
		const matchesFilter = filter === "all" || tItem.type.toLowerCase().includes(filter);
		const searchLower = search.toLowerCase();

		const matchesSearch =
			tItem.date.toLowerCase().includes(searchLower) ||
			tItem.amount.toString().toLowerCase().includes(searchLower) ||
			tItem.from.toLowerCase().includes(searchLower) ||
			tItem.to.toLowerCase().includes(searchLower);

		return matchesFilter && matchesSearch;
	});

	if (loading) {
		return (
			<DashboardShell>
				<div className="flex flex-col gap-4">
					<Skeleton className="h-10 w-64" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-96 w-full" />
				</div>
			</DashboardShell>
		);
	}

	if (error) {
		return (
			<DashboardShell>
				<Empty>
					<EmptyHeader>
						<EmptyTitle>{t("adminTransactions.somethingWentWrong")}</EmptyTitle>
						<EmptyDescription>{error}</EmptyDescription>
					</EmptyHeader>
					<Button onClick={() => window.location.reload()}>{t("adminTransactions.retry")}</Button>
				</Empty>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<DashboardPageHeader
				title={
					<span className="flex items-center gap-2">
						<ReceiptText className="size-7" /> {t("adminTransactions.title")}
					</span>
				}
				description={t("adminTransactions.description")}
			/>

			{disputedBookings.length > 0 || disputedOrders.length > 0 ? (
				<Card className="mb-6 p-5">
					<h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
						<ShieldAlert className="size-5 text-destructive" /> {t("adminTransactions.disputesTitle")}
					</h2>
					<div className="flex flex-col gap-3">
						{disputedBookings.map((b) => (
							<div key={b._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
								<div>
									<p className="text-sm font-medium text-foreground">
										{t("adminTransactions.consultationDispute", { patient: b.patientName, doctor: b.doctorName, amount: b.amountPaid })}
									</p>
									<p className="text-xs text-muted-foreground">{b.dispute?.reason}</p>
								</div>
								<div className="flex gap-2">
									<Button size="sm" variant="destructive" disabled={resolvingId === b._id} onClick={() => resolveDispute("booking", b._id, "refunded")}>
										{t("adminTransactions.refundPatient")}
									</Button>
									<Button size="sm" variant="outline" disabled={resolvingId === b._id} onClick={() => resolveDispute("booking", b._id, "released")}>
										{t("adminTransactions.releaseToDoctor")}
									</Button>
								</div>
							</div>
						))}
						{disputedOrders.map((o) => (
							<div key={o._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
								<div>
									<p className="text-sm font-medium text-foreground">
										{t("adminTransactions.orderDispute", { id: o._id, buyer: `${o.buyer?.firstName || ""} ${o.buyer?.lastName || ""}`.trim(), amount: o.totalPrice })}
									</p>
									<p className="text-xs text-muted-foreground">{o.dispute?.reason}</p>
								</div>
								<div className="flex gap-2">
									<Button size="sm" variant="destructive" disabled={resolvingId === o._id} onClick={() => resolveDispute("order", o._id, "refunded")}>
										{t("adminTransactions.refundPatient")}
									</Button>
									<Button size="sm" variant="outline" disabled={resolvingId === o._id} onClick={() => resolveDispute("order", o._id, "released")}>
										{t("adminTransactions.releaseToRetailer")}
									</Button>
								</div>
							</div>
						))}
					</div>
				</Card>
			) : null}

			<Card className="mb-6 flex flex-wrap items-end gap-5 p-5">
				<div className="flex min-w-52 flex-1 flex-col gap-2">
					<label htmlFor="transaction-filter" className="text-xs font-semibold uppercase tracking-wide text-foreground">
						{t("adminTransactions.category")}
					</label>
					<Select
						value={filter}
						onValueChange={setFilter}
						items={[
							{ value: "all", label: t("adminTransactions.allTransactions") },
							{ value: "patient-doctor", label: t("adminTransactions.patientDoctor") },
							{ value: "patient-retailer", label: t("adminTransactions.patientRetailer") },
							{ value: "doctor-retailer", label: t("adminTransactions.doctorRetailer") },
						]}
					>
						<SelectTrigger id="transaction-filter">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("adminTransactions.allTransactions")}</SelectItem>
							<SelectItem value="patient-doctor">{t("adminTransactions.patientDoctor")}</SelectItem>
							<SelectItem value="patient-retailer">{t("adminTransactions.patientRetailer")}</SelectItem>
							<SelectItem value="doctor-retailer">{t("adminTransactions.doctorRetailer")}</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex min-w-52 flex-1 flex-col gap-2">
					<label htmlFor="tx-search" className="text-xs font-semibold uppercase tracking-wide text-foreground">
						{t("adminTransactions.quickSearch")}
					</label>
					<div className="flex items-center gap-2 rounded-lg border border-input px-3 py-1">
						<Search className="size-4 shrink-0 text-muted-foreground" />
						<Input
							id="tx-search"
							placeholder={t("adminTransactions.searchPlaceholder")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
						/>
					</div>
				</div>
			</Card>

			{filteredTransactions.length > 0 ? (
				<Card className="overflow-hidden p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("adminTransactions.table.id")}</TableHead>
									<TableHead>{t("adminTransactions.table.type")}</TableHead>
									<TableHead>{t("adminTransactions.table.date")}</TableHead>
									<TableHead>{t("adminTransactions.table.amount")}</TableHead>
									<TableHead>{t("adminTransactions.table.from")}</TableHead>
									<TableHead>{t("adminTransactions.table.to")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredTransactions.map((tItem) => (
									<TableRow key={tItem.id}>
										<TableCell className="font-mono text-xs text-muted-foreground">{tItem.id}</TableCell>
										<TableCell>
											<Badge variant={badgeVariant(tItem.type)} className="uppercase">
												{tItem.type}
											</Badge>
										</TableCell>
										<TableCell>{tItem.date}</TableCell>
										<TableCell className="font-semibold text-foreground">
											₹{tItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
										</TableCell>
										<TableCell>{tItem.from}</TableCell>
										<TableCell>{tItem.to}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</Card>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Search />
						</EmptyMedia>
						<EmptyTitle>{t("adminTransactions.noResults")}</EmptyTitle>
						<EmptyDescription>{t("adminTransactions.noResultsDesc")}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</DashboardShell>
	);
};

export default Transactions;
