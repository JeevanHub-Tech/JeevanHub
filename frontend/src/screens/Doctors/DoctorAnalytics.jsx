import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import {
	PieChart,
	Pie,
	Cell,
	LineChart,
	Line,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	BarChart,
	Bar,
	LabelList,
	ScatterChart,
	Scatter,
	ResponsiveContainer,
} from "recharts";

import { 
	CreditCard, 
	Users, 
	UserCheck, 
	CalendarDays, 
	Star,
	Wallet,
	TrendingUp,
	TrendingDown,
	Calendar,
	Clock,
	CalendarCheck,
	ChevronDown,
	Utensils,
	Coins,
	PieChart as PieChartIcon
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
	const { t } = useTranslation();
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("payments");
	const [filterRange, setFilterRange] = useState("all");
	const [serviceFilter, setServiceFilter] = useState("all");
	const [searchDate, setSearchDate] = useState("");

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

	const acceptedBookings = bookings.filter((b) => b.requestAccept === "accepted");
	const nowTime = new Date();
	const completedBookings = acceptedBookings.filter((b) => new Date(b.dateOfAppointment) < nowTime);

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

	const completedCount = completedBookings.length;
	const totalAppointments = completedCount;

	const ageChartData = ageData.map((item) => {
		const pct = completedCount > 0 ? Math.round((item.count / completedCount) * 100) : 0;
		return {
			...item,
			percentage: pct,
			labelText: `${item.count} (${pct}%)`,
		};
	});

	const todayStr = new Date().toDateString();
	const todayAppointments = completedBookings.filter(
		(b) => new Date(b.dateOfAppointment).toDateString() === todayStr
	).length;

	const uniqueDays = new Set(completedBookings.map((b) => new Date(b.dateOfAppointment).toDateString())).size;
	const avgPerDay = uniqueDays > 0 ? (completedBookings.length / uniqueDays).toFixed(1) : "0.0";

	const totalRaw = bookings.length;
	const completedPct = totalRaw > 0 ? Math.round((completedCount / totalRaw) * 100) : 0;

	const cancelledCount = bookings.filter((b) => b.requestAccept === "denied").length;
	const cancelledPct = totalRaw > 0 ? Math.round((cancelledCount / totalRaw) * 100) : 0;

	const noShowCount = acceptedBookings.filter(
		(b) => new Date(b.dateOfAppointment) < nowTime && b.paymentStatus === "Pending"
	).length;
	const noShowPct = totalRaw > 0 ? Math.round((noShowCount / totalRaw) * 100) : 0;

	// Calculate live growth rate (last 30 days vs previous 30 days)
	const msInDay = 24 * 60 * 60 * 1000;
	const last30DaysCount = acceptedBookings.filter((b) => {
		const diff = nowTime - new Date(b.dateOfAppointment);
		return diff >= 0 && diff <= 30 * msInDay;
	}).length;

	const prev30DaysCount = acceptedBookings.filter((b) => {
		const diff = nowTime - new Date(b.dateOfAppointment);
		return diff > 30 * msInDay && diff <= 60 * msInDay;
	}).length;

	const absoluteDiff = last30DaysCount - prev30DaysCount;
	let growthText = "0";
	let growthColor = "text-muted-foreground";

	if (absoluteDiff > 0) {
		growthText = `▲ +${absoluteDiff}`;
		growthColor = "text-emerald-600";
	} else if (absoluteDiff < 0) {
		growthText = `▼ ${absoluteDiff}`;
		growthColor = "text-destructive";
	} else {
		growthText = "0";
		growthColor = "text-muted-foreground";
	}

	const ratedBookings = completedBookings.filter(
		(b) => b.rating !== null && b.rating !== undefined
	);

	// Peak Time Insights calculations
	const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const dayFullNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

	const getDayColIndex = (date) => {
		const d = new Date(date).getDay();
		return d === 0 ? 6 : d - 1;
	};

	const heatmapMatrix = [
		[0, 0, 0, 0, 0, 0, 0], // Morning
		[0, 0, 0, 0, 0, 0, 0], // Afternoon
		[0, 0, 0, 0, 0, 0, 0], // Evening
	];

	const timeSlotCounts = {
		"8 AM - 10 AM": 0,
		"10 AM - 12 PM": 0,
		"12 PM - 2 PM": 0,
		"2 PM - 4 PM": 0,
		"4 PM - 6 PM": 0,
		"6 PM - 8 PM": 0,
		"8 PM - 10 PM": 0,
	};

	const dayTotals = [0, 0, 0, 0, 0, 0, 0];

	acceptedBookings.forEach((b) => {
		const d = new Date(b.dateOfAppointment);
		const col = getDayColIndex(d);
		dayTotals[col] += 1;

		let hour = d.getHours();
		if (b.timeSlot && typeof b.timeSlot === "string") {
			const match = b.timeSlot.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
			if (match) {
				let h = parseInt(match[1], 10);
				const isPM = match[3]?.toUpperCase() === "PM";
				if (isPM && h !== 12) h += 12;
				if (!isPM && match[3]?.toUpperCase() === "AM" && h === 12) h = 0;
				hour = h;
			}
		}

		if (hour >= 8 && hour < 10) timeSlotCounts["8 AM - 10 AM"]++;
		else if (hour >= 10 && hour < 12) timeSlotCounts["10 AM - 12 PM"]++;
		else if (hour >= 12 && hour < 14) timeSlotCounts["12 PM - 2 PM"]++;
		else if (hour >= 14 && hour < 16) timeSlotCounts["2 PM - 4 PM"]++;
		else if (hour >= 16 && hour < 18) timeSlotCounts["4 PM - 6 PM"]++;
		else if (hour >= 18 && hour < 20) timeSlotCounts["6 PM - 8 PM"]++;
		else if (hour >= 20 && hour <= 22) timeSlotCounts["8 PM - 10 PM"]++;
		else if (hour < 8) timeSlotCounts["8 AM - 10 AM"]++;
		else timeSlotCounts["6 PM - 8 PM"]++;

		let row = 0;
		if (hour >= 6 && hour < 12) row = 0;
		else if (hour >= 12 && hour < 18) row = 1;
		else row = 2;

		heatmapMatrix[row][col] += 1;
	});

	let maxDayIdx = 0;
	let maxDayCount = dayTotals[0];
	dayTotals.forEach((count, idx) => {
		if (count > maxDayCount) {
			maxDayCount = count;
			maxDayIdx = idx;
		}
	});
	const busiestDay = maxDayCount > 0 ? dayFullNames[maxDayIdx] : "Saturday";

	const sortedSlots = Object.entries(timeSlotCounts).sort((a, b) => b[1] - a[1]);
	const busiestTimeSlot = sortedSlots[0] && sortedSlots[0][1] > 0 ? sortedSlots[0][0] : "6 PM - 8 PM";

	let maxHeatCount = 0;
	heatmapMatrix.forEach((r) => r.forEach((v) => { if (v > maxHeatCount) maxHeatCount = v; }));

	const sampleMatrix = [
		[1, 1, 2, 2, 2, 3, 2], // Morning
		[1, 2, 3, 4, 5, 6, 4], // Afternoon
		[2, 3, 5, 6, 8, 9, 6], // Evening
	];
	const activeMatrix = maxHeatCount > 0 ? heatmapMatrix : sampleMatrix;
	const activeMaxHeat = maxHeatCount > 0 ? maxHeatCount : 9;

	const getHeatColorClass = (val) => {
		if (val === 0) return "bg-muted/40";
		const ratio = val / activeMaxHeat;
		if (ratio <= 0.25) return "bg-[#e8eee0] dark:bg-primary/20";
		if (ratio <= 0.5) return "bg-[#cddbba] dark:bg-primary/40";
		if (ratio <= 0.75) return "bg-[#8da864] dark:bg-primary/65";
		return "bg-[#3f4f22] dark:bg-primary text-white";
	};

	const monthlyRatingsData = Array.from({ length: 12 }, (_, i) => {
		const monthBookings = ratedBookings.filter(
			(b) => new Date(b.dateOfAppointment).getFullYear() === currentYear &&
			       new Date(b.dateOfAppointment).getMonth() === i
		);
		const sum = monthBookings.reduce((acc, b) => acc + b.rating, 0);
		const count = monthBookings.length;
		return {
			month: new Date(currentYear, i).toLocaleString("default", { month: "short" }),
			averageRating: count > 0 ? parseFloat((sum / count).toFixed(1)) : null,
		};
	});

	// Helper to get the actual payment date (fallback to createdAt if paymentConfirmedAt is missing)
	const getPaymentDate = (b) => b.paymentConfirmedAt || b.createdAt;

	// Payment history: only appointments the doctor actually got paid for --
	// accepted + a completed payment (Razorpay-verified or doctor-confirmed proof).
	const paidBookings = acceptedBookings
		.filter((b) => b.amountPaid > 0 && b.paymentStatus === "Completed")
		.sort((a, b) => new Date(getPaymentDate(b)) - new Date(getPaymentDate(a)));

	// Separate payments into distinct line items for Appointment vs Diet Plan
	const allPaymentRecords = [];
	paidBookings.forEach((b) => {
		const dietFee = (b.dietPlanRequested && b.dietPlanFee) ? Number(b.dietPlanFee) : (b.dietPlanRequested ? 299 : 0);
		const consultationFee = Math.max(0, (Number(b.amountPaid) || 0) - dietFee);
		const pDate = getPaymentDate(b);
		const isCard = b.paymentMethod === "Card" || b.paymentDetails?.method === "card";
		const paymentMethod = isCard ? "Card" : "UPI";

		// 1. Appointment payment entry
		if (consultationFee > 0 || !b.dietPlanRequested) {
			allPaymentRecords.push({
				id: `${b._id}-appointment`,
				booking: b,
				patientName: b.patientName,
				paymentDate: pDate,
				appointmentDate: b.dateOfAppointment,
				service: "Appointment",
				serviceType: "appointment",
				amount: consultationFee > 0 ? consultationFee : b.amountPaid,
				paymentMethod: paymentMethod,
			});
		}

		// 2. Diet Plan payment entry (whether booked with consultation or requested after)
		if (b.dietPlanRequested && dietFee > 0) {
			allPaymentRecords.push({
				id: `${b._id}-diet`,
				booking: b,
				patientName: b.patientName,
				paymentDate: pDate,
				appointmentDate: b.dateOfAppointment,
				service: "Diet Plan",
				serviceType: "diet_plan",
				amount: dietFee,
				paymentMethod: paymentMethod,
			});
		}
	});

	const getFilteredPayments = () => {
		const now = new Date();
		return allPaymentRecords.filter((item) => {
			const paymentDate = new Date(item.paymentDate);

			if (serviceFilter !== "all" && item.serviceType !== serviceFilter) {
				return false;
			}

			if (searchDate) {
				const sDate = new Date(searchDate);
				return paymentDate.toDateString() === sDate.toDateString();
			}

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

	// Monthly Earnings Chart data for currentYear
	const monthlyEarningsData = Array.from({ length: 12 }, (_, i) => {
		const monthBookings = paidBookings.filter((b) => {
			const pDate = new Date(getPaymentDate(b));
			return pDate.getFullYear() === currentYear && pDate.getMonth() === i;
		});
		const amount = monthBookings.reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0);
		return {
			month: new Date(currentYear, i).toLocaleString("default", { month: "short" }),
			monthFull: new Date(currentYear, i).toLocaleString("default", { month: "long" }),
			amount: amount,
			displayLabel: `₹${amount}`,
		};
	});

	const totalEarningsYear = monthlyEarningsData.reduce((sum, item) => sum + item.amount, 0);
	const currentMonthIndex = nowTime.getMonth();
	const thisMonthEarnings = monthlyEarningsData[currentMonthIndex]?.amount || 0;
	const lastMonthEarnings = currentMonthIndex > 0 ? (monthlyEarningsData[currentMonthIndex - 1]?.amount || 0) : 0;

	let earningsGrowthPctText = "+0%";
	let earningsGrowthIsPositive = true;
	if (lastMonthEarnings > 0) {
		const diff = thisMonthEarnings - lastMonthEarnings;
		const pct = Math.round((diff / lastMonthEarnings) * 100);
		if (pct >= 0) {
			earningsGrowthPctText = `+${pct}%`;
			earningsGrowthIsPositive = true;
		} else {
			earningsGrowthPctText = `${pct}%`;
			earningsGrowthIsPositive = false;
		}
	} else if (thisMonthEarnings > 0) {
		earningsGrowthPctText = "+100%";
		earningsGrowthIsPositive = true;
	}

	// Insights:
	// 1. Highest Earnings Month
	const sortedByEarnings = [...monthlyEarningsData].sort((a, b) => b.amount - a.amount);
	const highestMonth = sortedByEarnings[0]?.amount > 0 ? sortedByEarnings[0] : null;
	const highestMonthLabel = highestMonth ? `${highestMonth.month} ${currentYear}` : `—`;
	const highestMonthAmount = highestMonth ? `₹${highestMonth.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}` : `₹0`;

	// 2. Avg Monthly Earnings
	const monthsPassed = Math.max(1, currentMonthIndex + 1);
	const avgMonthlyEarnings = totalEarningsYear / monthsPassed;

	// 3. Projected Next 30 Days
	let projectedEarningsText = "₹0";
	if (totalEarningsYear > 0) {
		const baseline = thisMonthEarnings > 0 ? thisMonthEarnings : avgMonthlyEarnings;
		const projMin = Math.round(baseline * 0.9);
		const projMax = Math.round(baseline * 1.3);
		projectedEarningsText = `₹${projMin.toLocaleString()} – ₹${projMax.toLocaleString()}`;
	} else {
		projectedEarningsText = "₹0";
	}

	// 4. Growth Trend
	let earningsGrowthTrend = "Neutral";
	if (thisMonthEarnings > lastMonthEarnings && thisMonthEarnings > 0) {
		earningsGrowthTrend = "Strong";
	} else if (thisMonthEarnings === lastMonthEarnings && thisMonthEarnings > 0) {
		earningsGrowthTrend = "Stable";
	} else if (thisMonthEarnings < lastMonthEarnings) {
		earningsGrowthTrend = "Moderate";
	}

	// Earnings Breakdown (Appointments vs Diet Plans)
	const appointmentTotalEarnings = allPaymentRecords
		.filter((r) => r.serviceType === "appointment")
		.reduce((sum, r) => sum + r.amount, 0);

	const dietPlanTotalEarnings = allPaymentRecords
		.filter((r) => r.serviceType === "diet_plan")
		.reduce((sum, r) => sum + r.amount, 0);

	const totalBreakdownRevenue = appointmentTotalEarnings + dietPlanTotalEarnings;
	const appointmentEarningsPct = totalBreakdownRevenue > 0
		? Math.round((appointmentTotalEarnings / totalBreakdownRevenue) * 100)
		: 70;
	const dietPlanEarningsPct = totalBreakdownRevenue > 0
		? Math.max(0, 100 - appointmentEarningsPct)
		: 30;

	const earningsBreakdownData = [
		{ name: "From Appointments", value: appointmentTotalEarnings || 70, color: "#3f4f22" },
		{ name: "From Diet Plans", value: dietPlanTotalEarnings || 30, color: "#c8a24a" },
	];

	// Top Services (by Volume: Appointment vs Diet Plan)
	const appointmentBookingsCount = allPaymentRecords.filter((r) => r.serviceType === "appointment").length;
	const dietPlanBookingsCount = allPaymentRecords.filter((r) => r.serviceType === "diet_plan").length;
	const totalServiceBookings = appointmentBookingsCount + dietPlanBookingsCount || 1;

	const apptVolumePct = Math.round((appointmentBookingsCount / totalServiceBookings) * 100);
	const dietVolumePct = Math.max(0, 100 - apptVolumePct);

	const topServicesData = [
		{
			name: "Appointment",
			count: appointmentBookingsCount,
			percentage: apptVolumePct,
			displayLabel: `${appointmentBookingsCount} (${apptVolumePct}%)`,
		},
		{
			name: "Diet Plan",
			count: dietPlanBookingsCount,
			percentage: dietVolumePct,
			displayLabel: `${dietPlanBookingsCount} (${dietVolumePct}%)`,
		},
	];

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
		{ id: "payments", label: t("analytics.tabs.payments", "Payments & Earnings"), icon: CreditCard },
		{ id: "gender", label: t("analytics.tabs.gender", "Gender Distribution"), icon: Users },
		{ id: "age", label: t("analytics.tabs.age", "Age Distribution"), icon: UserCheck },
		{ id: "appointments", label: t("analytics.tabs.appointments", "Monthly Appointments"), icon: CalendarDays },
		{ id: "ratings", label: t("analytics.tabs.ratings", "Patient Ratings"), icon: Star },
	];

	return (
		<DashboardShell>
			<DashboardPageHeader
				title={t("analytics.title", "Analytics Dashboard")}
				description={t("analytics.description", "Track your performance, payments, and patient statistics.")}
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
					<div className="flex flex-col gap-6">
						{/* 1. Payment History Card */}
						<Card className="overflow-hidden p-0">
							<div className="border-b border-border p-6 pb-4 flex flex-wrap items-center justify-between gap-4">
								<h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
									<CreditCard className="h-5 w-5 text-primary" /> {t("analytics.paymentHistory.title", "Payment History")}
								</h2>
								<div className="flex flex-wrap items-center gap-4">
									<div className="flex items-center gap-2">
										<label htmlFor="search-date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("analytics.paymentHistory.searchDate", "Search Date:")}</label>
										<input
											id="search-date"
											type="date"
											value={searchDate}
											onMouseDown={(e) => {
												e.preventDefault();
												try {
													e.target.showPicker();
												} catch (err) {
													console.error(err);
												}
											}}
											onChange={(e) => setSearchDate(e.target.value)}
											className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none cursor-pointer"
										/>
										{searchDate && (
											<button
												onClick={() => setSearchDate("")}
												className="text-xs text-destructive hover:underline font-semibold"
											>
												{t("analytics.paymentHistory.clear", "Clear")}
											</button>
										)}
									</div>
									<div className="flex items-center gap-2">
										<label htmlFor="service-filter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("analytics.paymentHistory.serviceFilter", "Service:")}</label>
										<select
											id="service-filter"
											value={serviceFilter}
											onChange={(e) => setServiceFilter(e.target.value)}
											className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm focus:border-primary focus:outline-none"
										>
											<option value="all">{t("analytics.paymentHistory.allServices", "All Services")}</option>
											<option value="appointment">{t("analytics.paymentHistory.appointment", "Appointment")}</option>
											<option value="diet_plan">{t("analytics.paymentHistory.dietPlan", "Diet Plan")}</option>
										</select>
									</div>
									<div className="flex items-center gap-2">
										<label htmlFor="payment-filter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("analytics.paymentHistory.filter", "Filter:")}</label>
										<select
											id="payment-filter"
											value={filterRange}
											onChange={(e) => setFilterRange(e.target.value)}
											className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm focus:border-primary focus:outline-none"
										>
											<option value="all">{t("analytics.paymentHistory.allPayments", "All Payments")}</option>
											<option value="today">{t("analytics.paymentHistory.today", "Today")}</option>
											<option value="week">{t("analytics.paymentHistory.last7Days", "Last 7 Days")}</option>
											<option value="month">{t("analytics.paymentHistory.last30Days", "Last 30 Days")}</option>
										</select>
									</div>
								</div>
							</div>
							{filteredPaidBookings.length === 0 ? (
								<p className="p-6 text-center text-muted-foreground">{t("analytics.paymentHistory.noPayments", "No payments found for this timeframe.")}</p>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="pl-6">{t("analytics.paymentHistory.colPatient", "Patient")}</TableHead>
												<TableHead>{t("analytics.paymentHistory.colDate", "Date")}</TableHead>
												<TableHead>{t("analytics.paymentHistory.colRefId", "Reference ID")}</TableHead>
												<TableHead>{t("analytics.paymentHistory.colService", "Service")}</TableHead>
												<TableHead>{t("analytics.paymentHistory.colMethod", "Payment Method")}</TableHead>
												<TableHead className="pr-6 text-right">{t("analytics.paymentHistory.colAmount", "Amount")}</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredPaidBookings.map((item) => {
												const apptYear = new Date(item.appointmentDate || item.booking.createdAt).getFullYear();
												const shortId = item.booking._id ? item.booking._id.toString().slice(-4).toUpperCase() : "0001";
												const prefix = item.serviceType === "diet_plan" ? "DIET" : "APT";
												const refId = `${prefix}-${apptYear}-${shortId}`;

												return (
													<TableRow key={item.id}>
														<TableCell className="pl-6 font-medium text-foreground">{item.patientName}</TableCell>
														<TableCell className="text-muted-foreground whitespace-nowrap">
															{new Date(item.paymentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
														</TableCell>
														<TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
															{refId}
														</TableCell>
														<TableCell>
															{item.serviceType === "diet_plan" ? (
																<span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
																	<Utensils className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> {t("analytics.paymentHistory.dietPlan", "Diet Plan")}
																</span>
															) : (
																<span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
																	<CalendarDays className="h-3.5 w-3.5" /> {t("analytics.paymentHistory.appointment", "Appointment")}
																</span>
															)}
														</TableCell>
														<TableCell className="text-xs text-muted-foreground font-semibold">
															<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
																{item.paymentMethod}
															</span>
														</TableCell>
														<TableCell className="pr-6 text-right font-bold text-primary whitespace-nowrap">
															₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							)}
						</Card>

						{/* 2. Monthly Earnings Graph & Insights (as requested in the design) */}
						<Card className="p-6">
							{/* Header */}
							<div className="flex items-center justify-between border-b border-border pb-4">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-primary">
										<Wallet className="h-5 w-5" />
									</div>
									<h2 className="text-lg font-semibold text-foreground">
										{t("analytics.monthlyEarnings.title", "Monthly Earnings")} ({currentYear})
									</h2>
								</div>
							</div>

							{/* Summary Row */}
							<div className="mt-5 flex flex-wrap items-start justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										{t("analytics.monthlyEarnings.totalEarnings", "Total Earnings")}
									</p>
									<div className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
										₹{totalEarningsYear.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
									</div>
									<div className={`mt-1.5 flex items-center gap-1.5 text-xs font-bold ${earningsGrowthIsPositive ? "text-emerald-600" : "text-destructive"}`}>
										{earningsGrowthIsPositive ? (
											<TrendingUp className="h-3.5 w-3.5" />
										) : (
											<TrendingDown className="h-3.5 w-3.5" />
										)}
										<span>{earningsGrowthPctText} {t("analytics.monthlyEarnings.vsLastMonth", "vs last month")}</span>
									</div>
								</div>

								{/* Month Indicator Card */}
								<div className="rounded-xl border border-border bg-muted/30 px-4 py-2 text-right shadow-xs">
									<div className="flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground">
										{t("analytics.monthlyEarnings.thisMonth", "This Month")} <ChevronDown className="h-3.5 w-3.5" />
									</div>
									<div className="text-base font-bold text-foreground">
										₹{thisMonthEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
									</div>
								</div>
							</div>

							{/* Graph + Insights side-by-side */}
							<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
								{/* Left: Monthly Bar Chart */}
								<div className="lg:col-span-8 xl:col-span-9">
									<ResponsiveContainer width="100%" height={290}>
										<BarChart
											data={monthlyEarningsData}
											margin={{ top: 25, right: 10, left: -15, bottom: 0 }}
										>
											<CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
											<XAxis
												dataKey="month"
												stroke={AXIS_COLOR}
												tick={{ fill: AXIS_COLOR, fontSize: 12 }}
												tickLine={false}
												axisLine={false}
											/>
											<YAxis
												stroke={AXIS_COLOR}
												tick={{ fill: AXIS_COLOR, fontSize: 11 }}
												tickLine={false}
												axisLine={false}
												tickFormatter={(val) => `₹${val}`}
											/>
											<Tooltip
												cursor={{ fill: "var(--muted)", opacity: 0.15 }}
												contentStyle={tooltipContentStyle}
												formatter={(val) => [`₹${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Earnings"]}
											/>
											<Bar
												dataKey="amount"
												fill="#3f4f22"
												radius={[6, 6, 0, 0]}
												maxBarSize={32}
											>
												<LabelList
													dataKey="displayLabel"
													position="top"
													style={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: "600" }}
												/>
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</div>

								{/* Right: Insights Panel */}
								<div className="lg:col-span-4 xl:col-span-3 flex flex-col justify-center space-y-4 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
									<h3 className="text-sm font-bold text-foreground">{t("analytics.monthlyEarnings.insightsTitle", "Earnings Insights")}</h3>

									{/* 1. Highest Earnings Month */}
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-primary">
											<Calendar className="h-5 w-5" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground font-medium leading-tight">{t("analytics.monthlyEarnings.highestMonth", "Highest Earnings Month")}</p>
											<p className="text-xs font-semibold text-foreground">{highestMonthLabel}</p>
											<p className="text-sm font-bold text-foreground">{highestMonthAmount}</p>
										</div>
									</div>

									{/* 2. Avg. Monthly Earnings */}
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-primary">
											<Clock className="h-5 w-5" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground font-medium leading-tight">{t("analytics.monthlyEarnings.avgMonthly", "Avg. Monthly Earnings")}</p>
											<p className="text-sm font-bold text-foreground">₹{avgMonthlyEarnings.toFixed(2)}</p>
										</div>
									</div>

									{/* 3. Projected (Next 30 Days) */}
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-primary">
											<CalendarCheck className="h-5 w-5" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground font-medium leading-tight">{t("analytics.monthlyEarnings.projected", "Projected (Next 30 Days)")}</p>
											<p className="text-sm font-bold text-foreground">{projectedEarningsText}</p>
										</div>
									</div>

									{/* 4. Growth Trend */}
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-primary">
											<TrendingUp className="h-5 w-5" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground font-medium leading-tight">{t("analytics.monthlyEarnings.growthTrend", "Growth Trend")}</p>
											<p className="text-sm font-bold text-foreground">{earningsGrowthTrend}</p>
										</div>
									</div>
								</div>
							</div>
						</Card>

						{/* 3. Bottom Row: Earnings Breakdown & Top Services */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							{/* Card A: Earnings Breakdown */}
							<Card className="flex flex-col justify-between p-6">
								<div>
									{/* Header */}
									<div className="flex items-center justify-between border-b border-border pb-4">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-primary">
												<PieChartIcon className="h-5 w-5" />
											</div>
											<h2 className="text-lg font-semibold text-foreground">
												{t("analytics.breakdown.title", "Earnings Breakdown")}
											</h2>
										</div>
									</div>

									{/* Donut Chart + Legend */}
									<div className="mt-6 flex flex-col items-center justify-center sm:flex-row sm:gap-8">
										<div className="relative h-44 w-44 shrink-0">
											<ResponsiveContainer width="100%" height="100%">
												<PieChart>
													<Pie
														data={earningsBreakdownData}
														cx="50%"
														cy="50%"
														innerRadius={48}
														outerRadius={75}
														paddingAngle={3}
														dataKey="value"
														stroke="none"
													>
														{earningsBreakdownData.map((entry, index) => (
															<Cell key={`cell-${index}`} fill={entry.color} />
														))}
													</Pie>
													<Tooltip contentStyle={tooltipContentStyle} formatter={(val) => [`₹${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, ""]} />
												</PieChart>
											</ResponsiveContainer>
										</div>

										{/* Legend items */}
										<div className="mt-4 flex flex-col gap-4 sm:mt-0">
											<div>
												<div className="flex items-center gap-2">
													<div className="h-3.5 w-3.5 rounded-full bg-[#3f4f22]" />
													<span className="text-xs font-semibold text-muted-foreground">{t("analytics.breakdown.fromAppointments", "From Appointments")}</span>
												</div>
												<p className="mt-1 text-base font-bold text-foreground pl-5.5">
													₹{appointmentTotalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({appointmentEarningsPct}%)
												</p>
											</div>

											<div>
												<div className="flex items-center gap-2">
													<div className="h-3.5 w-3.5 rounded-full bg-[#c8a24a]" />
													<span className="text-xs font-semibold text-muted-foreground">{t("analytics.breakdown.fromDietPlans", "From Diet Plans")}</span>
												</div>
												<p className="mt-1 text-base font-bold text-foreground pl-5.5">
													₹{dietPlanTotalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({dietPlanEarningsPct}%)
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Bottom Highlight banner */}
								<div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3f4f22] text-white">
										<Coins className="h-5 w-5 text-amber-300" />
									</div>
									<p className="text-xs font-medium text-foreground">
										{t("analytics.breakdown.banner", "Diet plans contributed {{pct}}% of total earnings", { pct: dietPlanEarningsPct })}
									</p>
								</div>
							</Card>

							{/* Card B: Top Services (by Volume) */}
							<Card className="flex flex-col justify-between p-6">
								<div>
									{/* Header */}
									<div className="flex items-center justify-between border-b border-border pb-4">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-primary">
												<Star className="h-5 w-5" />
											</div>
											<h2 className="text-lg font-semibold text-foreground">
												{t("analytics.topServices.title", "Top Services (by Volume)")}
											</h2>
										</div>
									</div>

									{/* Horizontal Bar Chart for the two services */}
									<div className="mt-6">
										<ResponsiveContainer width="100%" height={160}>
											<BarChart
												layout="vertical"
												data={topServicesData}
												margin={{ top: 10, right: 65, left: 10, bottom: 5 }}
											>
												<CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
												<XAxis type="number" stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
												<YAxis
													type="category"
													dataKey="name"
													stroke={AXIS_COLOR}
													tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: "600" }}
													tickLine={false}
													axisLine={false}
													width={100}
												/>
												<Tooltip
													cursor={{ fill: "var(--muted)", opacity: 0.15 }}
													contentStyle={tooltipContentStyle}
													formatter={(val) => [`${val} orders`, "Volume"]}
												/>
												<Bar
													dataKey="count"
													fill="#3f4f22"
													radius={[0, 6, 6, 0]}
													maxBarSize={22}
												>
													<LabelList
														dataKey="displayLabel"
														position="right"
														style={{ fill: "var(--foreground)", fontSize: 11, fontWeight: "600" }}
													/>
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</div>

								{/* Bottom info row */}
								<div className="mt-6 flex items-center justify-around rounded-xl bg-muted/40 p-3 border border-border">
									<div className="text-center">
										<p className="text-[11px] font-semibold text-muted-foreground uppercase">{t("analytics.topServices.appointmentsLabel", "Appointments")}</p>
										<p className="text-base font-bold text-foreground">{appointmentBookingsCount}</p>
									</div>
									<div className="h-8 w-px bg-border" />
									<div className="text-center">
										<p className="text-[11px] font-semibold text-muted-foreground uppercase">{t("analytics.topServices.dietPlansLabel", "Diet Plans")}</p>
										<p className="text-base font-bold text-amber-700 dark:text-amber-400">{dietPlanBookingsCount}</p>
									</div>
								</div>
							</Card>
						</div>
					</div>
				)}

				{activeTab === "gender" && (
					<Card className="p-6">
						<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground flex items-center gap-2">
							<Users className="h-5 w-5 text-primary" /> {t("analytics.gender.title", "Patient Gender Distribution")}
						</h2>
						{genderData.length === 0 ? (
							<p className="py-12 text-center text-muted-foreground">{t("analytics.gender.noData", "No gender data available.")}</p>
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
											<span className="text-sm text-muted-foreground">{d.value} {t("analytics.gender.patients", "patient(s)")}</span>
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
							<UserCheck className="h-5 w-5 text-primary" /> {t("analytics.age.title", "Patient Age Distribution")}
						</h2>
						<ResponsiveContainer width="100%" height={320}>
							<BarChart
								data={ageChartData}
								margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
							>
								<CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
								<XAxis dataKey="ageGroup" stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
								<YAxis
									stroke={AXIS_COLOR}
									tick={{ fill: AXIS_COLOR }}
									tickLine={false}
									axisLine={false}
									allowDecimals={false}
								/>
								<Tooltip cursor={{ fill: "var(--muted)", opacity: 0.15 }} contentStyle={tooltipContentStyle} />
								<Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
									<LabelList dataKey="labelText" position="top" style={{ fill: "var(--foreground)", fontSize: 11, fontWeight: "600" }} />
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</Card>
				)}

				{activeTab === "appointments" && (
					<div className="flex flex-col gap-6">
						{/* 1. Appointments Overview Card with Area Chart */}
						<Card className="p-6">
							<div className="flex flex-col gap-6">
								<h2 className="border-b border-border pb-3 text-lg font-semibold text-foreground flex items-center gap-2">
									<CalendarDays className="h-5 w-5 text-primary" /> {t("analytics.appointmentsOverview.title", "Appointments Overview")}
								</h2>

								{/* Top Summary stats cards */}
								<div className="grid grid-cols-2 gap-4">
									<div className="rounded-lg bg-muted/50 p-4">
										<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("analytics.appointmentsOverview.last30Days", "Appointments (Last 30 Days)")}</p>
										<div className="mt-1.5 flex items-baseline gap-2">
											<span className="text-3xl font-bold text-foreground">{last30DaysCount}</span>
											<span className={`text-xs font-semibold flex items-center ${growthColor}`}>
												{growthText}
											</span>
										</div>
										<p className="mt-0.5 text-[10px] text-muted-foreground">{t("analytics.appointmentsOverview.vsPrev30Days", "vs previous 30 days")}</p>
									</div>
									<div className="rounded-lg bg-muted/50 p-4">
										<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("analytics.appointmentsOverview.today", "Today")}</p>
										<div className="mt-1.5 flex items-baseline gap-2">
											<span className="text-3xl font-bold text-foreground">{todayAppointments}</span>
											<span className="text-xs text-muted-foreground ml-1">{t("analytics.topServices.appointmentsLabel", "Appointments")}</span>
										</div>
										<p className="mt-0.5 text-[10px] text-muted-foreground">{t("analytics.appointmentsOverview.doneToday", "done today")}</p>
									</div>
								</div>

								{/* The Area Chart */}
								<ResponsiveContainer width="100%" height={260}>
									<AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<defs>
											<linearGradient id="appointmentGradient" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
												<stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
										<XAxis dataKey="month" stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
										<YAxis
											stroke={AXIS_COLOR}
											tick={{ fill: AXIS_COLOR }}
											tickLine={false}
											axisLine={false}
											allowDecimals={false}
										/>
										<Tooltip cursor={{ stroke: "var(--primary)", strokeWidth: 1 }} contentStyle={tooltipContentStyle} />
										<Area
											type="monotone"
											dataKey="count"
											name="Appointments"
											stroke="var(--primary)"
											strokeWidth={3}
											fillOpacity={1}
											fill="url(#appointmentGradient)"
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</Card>

						{/* 2. Peak Time Insights Card */}
						<Card className="p-6">
							{/* Header */}
							<div className="flex items-center justify-between border-b border-border pb-4">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-primary">
										<Clock className="h-5 w-5" />
									</div>
									<h2 className="text-lg font-semibold text-foreground">
										{t("analytics.peakTime.title", "Peak Time Insights")}
									</h2>
								</div>
							</div>

							<div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
								{/* Left Stats Column */}
								<div className="flex flex-col justify-center gap-5 border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-8 sm:min-w-[200px]">
									<div>
										<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											{t("analytics.peakTime.busiestDay", "Busiest Day")}
										</p>
										<p className="mt-1 text-2xl font-extrabold text-[#2e4722] dark:text-primary tracking-tight">
											{busiestDay}
										</p>
									</div>

									<hr className="border-border hidden sm:block" />

									<div>
										<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											{t("analytics.peakTime.busiestSlot", "Busiest Time Slot")}
										</p>
										<p className="mt-1 text-2xl font-extrabold text-[#2e4722] dark:text-primary tracking-tight">
											{busiestTimeSlot}
										</p>
									</div>
								</div>

								{/* Right Heatmap Matrix */}
								<div className="flex-1 overflow-x-auto">
									<div className="min-w-[480px]">
										{/* Day Headers */}
										<div className="grid grid-cols-8 gap-2 text-center text-xs font-semibold text-muted-foreground mb-2">
											<div className="text-left font-normal text-transparent">Slot</div>
											{dayNames.map((d) => (
												<div key={d}>{d}</div>
											))}
										</div>

										{/* Rows */}
										{[
											{ label: t("analytics.peakTime.morning", "Morning"), sub: t("analytics.peakTime.morningSub", "(6 AM - 12 PM)"), rowIdx: 0 },
											{ label: t("analytics.peakTime.afternoon", "Afternoon"), sub: t("analytics.peakTime.afternoonSub", "(12 PM - 6 PM)"), rowIdx: 1 },
											{ label: t("analytics.peakTime.evening", "Evening"), sub: t("analytics.peakTime.eveningSub", "(6 PM - 10 PM)"), rowIdx: 2 },
										].map((timePeriod) => (
											<div key={timePeriod.rowIdx} className="grid grid-cols-8 gap-2 items-center mb-2.5">
												<div className="text-left text-xs">
													<p className="font-semibold text-foreground leading-tight">{timePeriod.label}</p>
													<p className="text-[10px] text-muted-foreground leading-tight">{timePeriod.sub}</p>
												</div>
												{dayNames.map((_, colIdx) => {
													const val = activeMatrix[timePeriod.rowIdx][colIdx];
													return (
														<div
															key={colIdx}
															title={`${dayFullNames[colIdx]} ${timePeriod.label}: ${val} appointment(s)`}
															className={`h-9 rounded-md transition-all duration-150 flex items-center justify-center cursor-default ${getHeatColorClass(val)}`}
														/>
													);
												})}
											</div>
										))}

										{/* Bottom Activity Legend */}
										<div className="mt-4 flex items-center justify-end gap-2 text-xs font-medium text-muted-foreground">
											<span>{t("analytics.peakTime.lowActivity", "Low Activity")}</span>
											<div className="flex items-center gap-1">
												<div className="h-3.5 w-3.5 rounded-xs bg-[#e8eee0] dark:bg-primary/20" />
												<div className="h-3.5 w-3.5 rounded-xs bg-[#cddbba] dark:bg-primary/40" />
												<div className="h-3.5 w-3.5 rounded-xs bg-[#8da864] dark:bg-primary/65" />
												<div className="h-3.5 w-3.5 rounded-xs bg-[#3f4f22] dark:bg-primary" />
											</div>
											<span>{t("analytics.peakTime.highActivity", "High Activity")}</span>
										</div>
									</div>
								</div>
							</div>
						</Card>
					</div>
				)}

				{activeTab === "ratings" && (
					<Card className="p-6">
						<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground flex items-center gap-2">
							<Star className="h-5 w-5 text-primary fill-primary/10" /> {t("analytics.ratingsTrend.title", "Patient Ratings Trend (Monthly Average)")}
						</h2>
						{ratedBookings.length === 0 ? (
							<p className="py-12 text-center text-muted-foreground">{t("analytics.ratingsTrend.noData", "No ratings received yet.")}</p>
						) : (
							<ResponsiveContainer width="100%" height={320}>
								<AreaChart data={monthlyRatingsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
									<defs>
										<linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
											<stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
									<XAxis dataKey="month" stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
									<YAxis
										domain={[1, 5]}
										ticks={[1, 2, 3, 4, 5]}
										stroke={AXIS_COLOR}
										tick={{ fill: AXIS_COLOR }}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip cursor={{ stroke: "var(--primary)", strokeWidth: 1 }} contentStyle={tooltipContentStyle} />
									<Area
										type="monotone"
										dataKey="averageRating"
										name="Average Rating"
										stroke="var(--primary)"
										strokeWidth={3}
										fillOpacity={1}
										fill="url(#ratingGradient)"
										connectNulls={true}
									/>
								</AreaChart>
							</ResponsiveContainer>
						)}
					</Card>
				)}
			</div>
		</DashboardShell>
	);
}

export default DoctorAnalytics;
