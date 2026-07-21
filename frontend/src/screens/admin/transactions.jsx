import { useState, useEffect } from "react";
import { ReceiptText, Search } from "lucide-react";

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
	const [filter, setFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchTransactions(setTransactions, setLoading, setError);
	}, []);

	const filteredTransactions = transactions.filter((t) => {
		const matchesFilter = filter === "all" || t.type.toLowerCase().includes(filter);
		const searchLower = search.toLowerCase();

		const matchesSearch =
			t.date.toLowerCase().includes(searchLower) ||
			t.amount.toString().toLowerCase().includes(searchLower) ||
			t.from.toLowerCase().includes(searchLower) ||
			t.to.toLowerCase().includes(searchLower);

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
						<EmptyTitle>Something went wrong</EmptyTitle>
						<EmptyDescription>{error}</EmptyDescription>
					</EmptyHeader>
					<Button onClick={() => window.location.reload()}>Retry</Button>
				</Empty>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<DashboardPageHeader
				title={
					<span className="flex items-center gap-2">
						<ReceiptText className="size-7" /> Transactions
					</span>
				}
				description="View and manage all Ayurvedic commerce history"
			/>

			<Card className="mb-6 flex flex-wrap items-end gap-5 p-5">
				<div className="flex min-w-52 flex-1 flex-col gap-2">
					<label htmlFor="transaction-filter" className="text-xs font-semibold uppercase tracking-wide text-foreground">
						Category
					</label>
					<Select value={filter} onValueChange={setFilter}>
						<SelectTrigger id="transaction-filter">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Transactions</SelectItem>
							<SelectItem value="patient-doctor">Patient-Doctor</SelectItem>
							<SelectItem value="patient-retailer">Patient-Retailer</SelectItem>
							<SelectItem value="doctor-retailer">Doctor-Retailer</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex min-w-52 flex-1 flex-col gap-2">
					<label htmlFor="tx-search" className="text-xs font-semibold uppercase tracking-wide text-foreground">
						Quick Search
					</label>
					<div className="flex items-center gap-2 rounded-lg border border-input px-3 py-1">
						<Search className="size-4 shrink-0 text-muted-foreground" />
						<Input
							id="tx-search"
							placeholder="Search by date, amount, or name..."
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
									<TableHead>Transaction ID</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>From</TableHead>
									<TableHead>To</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredTransactions.map((t) => (
									<TableRow key={t.id}>
										<TableCell className="font-mono text-xs text-muted-foreground">{t.id}</TableCell>
										<TableCell>
											<Badge variant={badgeVariant(t.type)} className="uppercase">
												{t.type}
											</Badge>
										</TableCell>
										<TableCell>{t.date}</TableCell>
										<TableCell className="font-semibold text-foreground">
											${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
										</TableCell>
										<TableCell>{t.from}</TableCell>
										<TableCell>{t.to}</TableCell>
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
						<EmptyTitle>No results found</EmptyTitle>
						<EmptyDescription>Try adjusting your filters or search keywords.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</DashboardShell>
	);
};

export default Transactions;
