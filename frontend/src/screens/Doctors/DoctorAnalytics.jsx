import { useState, useEffect, useContext } from "react";
import {
	PieChart,
	Pie,
	Cell,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	BarChart,
	Bar,
	ScatterChart,
	Scatter,
	ResponsiveContainer,
} from "recharts";

import { 
	CreditCard, 
	Users, 
	UserCheck, 
	CalendarDays, 
	Star 
} from "lucide-react";

import { BACKEND_URL } from "../../config";
import { authFetch } from "../../utils/authFetch";
import { AuthContext } from "../../context/AuthContext";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);

	if (percent === 0) return null;

	return (
		<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize="14">
			{`${(percent * 100).toFixed(0)}%`}
		</text>
	);
};

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const SERIES_COLOR = "var(--primary)";
const AXIS_COLOR = "var(--muted-foreground)";
const GRID_COLOR = "var(--border)";

const tooltipContentStyle = {
	borderRadius: "var(--jh-radius-md, 8px)",
	border: "1px solid var(--border)",
	background: "var(--popover)",
	color: "var(--popover-foreground)",
	boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
};

function DoctorAnalytics() {
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("payments");
	const [filterRange, setFilterRange] = useState("all");

	const { auth } = useContext(AuthContext);
	const doctorId = auth.user?.id;

	useEffect(() => {
		const fetchBookings = async () => {
			if (!doctorId) {
				setLoading(false);
				setError("Error: Doctor ID not found.");
				return;
			}

			try {
				const response = await authFetch(`${BACKEND_URL}/api/bookings/doctor/${doctorId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});
				if (!response.ok) {
					throw new Error("Failed to fetch bookings");
				}

				const data = await response.json();
				const doctorBookings = Array.isArray(data.bookings) ? data.bookings : [];
				setBookings(doctorBookings);
				setLoading(false);
			} catch (error) {
				setError(error.message);
				setLoading(false);
			}
		};

		fetchBookings();
	}, [doctorId]);

	const parseAppointmentDateTime = (dateStr, timeStr) => {
		if (!dateStr) return new Date(0);
		const dateObj = new Date(dateStr);
		if (!timeStr || typeof timeStr !== 'string') return dateObj;
		
		let [hoursStr, minutesStr] = timeStr.split(':');
		let hours = parseInt(hoursStr, 10);
		let minutes = parseInt(minutesStr, 10) || 0;
		
		if (timeStr.toLowerCase().includes('pm') && hours < 12) hours += 12;
		if (timeStr.toLowerCase().includes('am') && hours === 12) hours = 0;
		
		dateObj.setHours(hours, minutes, 0, 0);
		return dateObj;
	};

	// Demographics, monthly appointment count, and ratings trend should only reflect
	// COMPLETED (past) accepted appointments.
	const now = new Date();
	const completedBookings = bookings.filter((b) => {
		if (b.requestAccept !== "accepted") return false;
		const apptDate = parseAppointmentDateTime(b.dateOfAppointment, b.timeSlot);
		return apptDate < now;
	});

	// For the payments history table, we show all paid bookings (including upcoming ones)
	const acceptedBookings = bookings.filter((b) => b.requestAccept === "accepted");

	const genderData = [
		{ name: "Male", value: completedBookings.filter((b) => b.patientGender === "Male").length },
		{ name: "Female", value: completedBookings.filter((b) => b.patientGender === "Female").length },
		{ name: "Other", value: completedBookings.filter((b) => b.patientGender === "Other").length },
	].filter((d) => d.value > 0);

	const ageData = [
		{ ageGroup: "0-10", count: completedBookings.filter((b) => b.patientAge >= 0 && b.patientAge <= 10).length },
		{ ageGroup: "11-20", count: completedBookings.filter((b) => b.patientAge >= 11 && b.patientAge <= 20).length },
		{ ageGroup: "21-30", count: completedBookings.filter((b) => b.patientAge >= 21 && b.patientAge <= 30).length },
		{ ageGroup: "31-40", count: completedBookings.filter((b) => b.patientAge >= 31 && b.patientAge <= 40).length },
		{ ageGroup: "41-50", count: completedBookings.filter((b) => b.patientAge >= 41 && b.patientAge <= 50).length },
		{ ageGroup: "51+", count: completedBookings.filter((b) => b.patientAge >= 51).length },
	];

	const currentYear = new Date().getFullYear();
	const currentYearBookings = completedBookings.filter(
		(booking) => new Date(booking.dateOfAppointment).getFullYear() === currentYear
	);

	const monthlyData = Array.from({ length: 12 }, (_, i) => {
		return {
			month: new Date(currentYear, i).toLocaleString("default", { month: "short" }),
			count: currentYearBookings.filter((booking) => new Date(booking.dateOfAppointment).getMonth() === i).length,
		};
	});

	const ratingsByDate = completedBookings
		.filter((b) => b.rating !== null && b.rating !== undefined)
		.reduce((acc, b) => {
			const key = new Date(b.dateOfAppointment).toISOString().split('T')[0];
			if (!acc[key]) {
				acc[key] = { sum: 0, count: 0, dateObj: new Date(b.dateOfAppointment) };
			}
			acc[key].sum += b.rating;
			acc[key].count += 1;
			return acc;
		}, {});

	const averageRatingData = Object.keys(ratingsByDate)
		.map((key) => {
			const item = ratingsByDate[key];
			return {
				date: item.dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
				averageRating: parseFloat((item.sum / item.count).toFixed(1)),
				dateObj: item.dateObj,
			};
		})
		.sort((a, b) => a.dateObj - b.dateObj);

	// Helper to get the actual payment date (fallback to createdAt if paymentConfirmedAt is missing)
	const getPaymentDate = (b) => b.paymentConfirmedAt || b.createdAt;

	// Payment history: only appointments the doctor actually got paid for --
	// accepted + a completed payment (Razorpay-verified or doctor-confirmed proof).
	const paidBookings = acceptedBookings
		.filter((b) => b.amountPaid > 0 && b.paymentStatus === "Completed")
		.sort((a, b) => new Date(getPaymentDate(b)) - new Date(getPaymentDate(a)));

	const getFilteredPayments = () => {
		const now = new Date();
		return paidBookings.filter((b) => {
			const paymentDate = new Date(getPaymentDate(b));
			if (filterRange === "today") {
				return paymentDate.toDateString() === now.toDateString();
			}
			if (filterRange === "week") {
				const oneWeekAgo = new Date();
				oneWeekAgo.setDate(now.getDate() - 7);
				return paymentDate >= oneWeekAgo;
			}
			if (filterRange === "month") {
				const oneMonthAgo = new Date();
				oneMonthAgo.setDate(now.getDate() - 30);
				return paymentDate >= oneMonthAgo;
			}
			return true; // "all"
		});
	};

	const filteredPaidBookings = getFilteredPayments();

	if (loading) {
		return (
			<DashboardShell>
				<Skeleton className="h-12 w-full rounded-lg mb-6" />
				<Skeleton className="h-[400px] w-full rounded-xl" />
			</DashboardShell>
		);
	}

	if (error) {
		return (
			<DashboardShell>
				<p className="mx-auto w-fit rounded-lg bg-destructive/10 px-6 py-4 font-medium text-destructive">
					Error: {error}
				</p>
			</DashboardShell>
		);
	}

	const tabs = [
		{ id: "payments", label: "Payments & Earnings", icon: CreditCard },
		{ id: "gender", label: "Gender Distribution", icon: Users },
		{ id: "age", label: "Age Distribution", icon: UserCheck },
		{ id: "appointments", label: "Monthly Appointments", icon: CalendarDays },
		{ id: "ratings", label: "Patient Ratings", icon: Star },
	];

	return (
		<DashboardShell>
			<DashboardPageHeader
				title="Analytics Dashboard"
				description="Track your performance, payments, and patient statistics."
			/>

			{/* Sub-navigation tabs */}
			<div className="mb-6 flex flex-wrap gap-2 rounded-xl bg-muted p-1">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
								isActive
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:bg-background/40 hover:text-foreground"
							}`}
						>
							<Icon className="h-4 w-4" />
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Render dynamic section content based on activeTab */}
			<div className="transition-all duration-300">
				{activeTab === "payments" && (
					<Card className="overflow-hidden p-0">
						<div className="border-b border-border p-6 pb-4 flex flex-wrap items-center justify-between gap-4">
							<h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
								<CreditCard className="h-5 w-5 text-primary" /> Payment History
							</h2>
							<div className="flex items-center gap-2">
								<label htmlFor="payment-filter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter:</label>
								<select
									id="payment-filter"
									value={filterRange}
									onChange={(e) => setFilterRange(e.target.value)}
									className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm focus:border-primary focus:outline-none"
								>
									<option value="all">All Payments</option>
									<option value="today">Today</option>
									<option value="week">Last 7 Days</option>
									<option value="month">Last 30 Days</option>
								</select>
							</div>
						</div>
						{filteredPaidBookings.length === 0 ? (
							<p className="p-6 text-center text-muted-foreground">No payments found for this timeframe.</p>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="pl-6">Patient</TableHead>
											<TableHead>Payment Date</TableHead>
											<TableHead>Appointment Date</TableHead>
											<TableHead className="pr-6 text-right">Amount</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredPaidBookings.map((b) => (
											<TableRow key={b._id}>
												<TableCell className="pl-6 font-medium">{b.patientName}</TableCell>
												<TableCell>
													{new Date(getPaymentDate(b)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
												</TableCell>
												<TableCell>
													{new Date(b.dateOfAppointment).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
												</TableCell>
												<TableCell className="pr-6 text-right font-bold text-primary">₹{b.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</Card>
				)}

				{activeTab === "gender" && (
					<Card className="p-6">
						<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground flex items-center gap-2">
							<Users className="h-5 w-5 text-primary" /> Patient Gender Distribution
						</h2>
						{genderData.length === 0 ? (
							<p className="py-12 text-center text-muted-foreground">No gender data available.</p>
						) : (
							<div className="flex flex-col items-center justify-center md:flex-row md:gap-12">
								<ResponsiveContainer width="100%" height={320} className="max-w-[400px]">
									<PieChart>
										<Pie
											data={genderData}
											cx="50%"
											cy="50%"
											innerRadius={80}
											outerRadius={120}
											dataKey="value"
											label={renderCustomizedLabel}
											labelLine={false}
											stroke="none"
										>
											{genderData.map((_entry, index) => (
												<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
											))}
										</Pie>
										<Tooltip contentStyle={tooltipContentStyle} />
									</PieChart>
								</ResponsiveContainer>
								<div className="flex flex-col gap-4 mt-6 md:mt-0">
									{genderData.map((d, index) => (
										<div key={d.name} className="flex items-center gap-3">
											<div className="h-4 w-4 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
											<span className="text-sm font-semibold text-foreground">{d.name}:</span>
											<span className="text-sm text-muted-foreground">{d.value} patient(s)</span>
										</div>
									))}
								</div>
							</div>
						)}
					</Card>
				)}

				{activeTab === "age" && (
					<Card className="p-6">
						<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground flex items-center gap-2">
							<UserCheck className="h-5 w-5 text-primary" /> Patient Age Distribution
						</h2>
						<ResponsiveContainer width="100%" height={320}>
							<LineChart data={ageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
								<XAxis dataKey="ageGroup" stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
								<YAxis stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
								<Tooltip contentStyle={tooltipContentStyle} />
								<Line
									type="monotone"
									dataKey="count"
									name="Patients"
									stroke={SERIES_COLOR}
									strokeWidth={3}
									dot={{ r: 5, strokeWidth: 2 }}
									activeDot={{ r: 8 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</Card>
				)}

				{activeTab === "appointments" && (
					<Card className="p-6">
						<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground flex items-center gap-2">
							<CalendarDays className="h-5 w-5 text-primary" /> Monthly Appointments ({currentYear})
						</h2>
						<ResponsiveContainer width="100%" height={320}>
							<BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
								<XAxis dataKey="month" stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
								<YAxis
									stroke={AXIS_COLOR}
									tick={{ fill: AXIS_COLOR }}
									tickLine={false}
									axisLine={false}
									allowDecimals={false}
								/>
								<Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipContentStyle} />
								<Bar dataKey="count" name="Appointments" fill={SERIES_COLOR} radius={[6, 6, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</Card>
				)}

				{activeTab === "ratings" && (
					<Card className="p-6">
						<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground flex items-center gap-2">
							<Star className="h-5 w-5 text-primary fill-primary/10" /> Patient Ratings Trend (Daily Average)
						</h2>
						{averageRatingData.length === 0 ? (
							<p className="py-12 text-center text-muted-foreground">No ratings received yet.</p>
						) : (
							<ResponsiveContainer width="100%" height={320}>
								<LineChart data={averageRatingData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
									<CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
									<XAxis dataKey="date" stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
									<YAxis
										domain={[1, 5]}
										ticks={[1, 2, 3, 4, 5]}
										stroke={AXIS_COLOR}
										tick={{ fill: AXIS_COLOR }}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip contentStyle={tooltipContentStyle} />
									<Line
										type="monotone"
										dataKey="averageRating"
										name="Average Rating"
										stroke={SERIES_COLOR}
										strokeWidth={3}
										dot={{ r: 5, strokeWidth: 2 }}
										activeDot={{ r: 8 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						)}
					</Card>
				)}
			</div>
		</DashboardShell>
	);
}

export default DoctorAnalytics;
