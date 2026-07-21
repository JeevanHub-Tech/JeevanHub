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

import { BACKEND_URL } from "../../config";
import { authFetch } from "../../utils/authFetch";
import { AuthContext } from "../../context/AuthContext";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

	const genderData = [
		{ name: "Male", value: bookings.filter((b) => b.patientGender === "Male").length },
		{ name: "Female", value: bookings.filter((b) => b.patientGender === "Female").length },
		{ name: "Other", value: bookings.filter((b) => b.patientGender === "Other").length },
	].filter((d) => d.value > 0);

	const ageData = [
		{ ageGroup: "0-10", count: bookings.filter((b) => b.patientAge >= 0 && b.patientAge <= 10).length },
		{ ageGroup: "11-20", count: bookings.filter((b) => b.patientAge >= 11 && b.patientAge <= 20).length },
		{ ageGroup: "21-30", count: bookings.filter((b) => b.patientAge >= 21 && b.patientAge <= 30).length },
		{ ageGroup: "31-40", count: bookings.filter((b) => b.patientAge >= 31 && b.patientAge <= 40).length },
		{ ageGroup: "41-50", count: bookings.filter((b) => b.patientAge >= 41 && b.patientAge <= 50).length },
		{ ageGroup: "51+", count: bookings.filter((b) => b.patientAge >= 51).length },
	];

	const currentYear = new Date().getFullYear();
	const currentYearBookings = bookings.filter(
		(booking) => new Date(booking.dateOfAppointment).getFullYear() === currentYear
	);

	const monthlyData = Array.from({ length: 12 }, (_, i) => {
		return {
			month: new Date(currentYear, i).toLocaleString("default", { month: "short" }),
			count: currentYearBookings.filter((booking) => new Date(booking.dateOfAppointment).getMonth() === i).length,
		};
	});

	const ratingData = bookings
		.filter((b) => b.rating !== null)
		.map((b) => ({ rating: b.rating, date: new Date(b.dateOfAppointment).toLocaleDateString() }));

	if (loading) {
		return (
			<DashboardShell>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-80 rounded-xl" />
					))}
				</div>
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

	return (
		<DashboardShell>
			<DashboardPageHeader
				title="Dashboard Overview"
				description="Track your appointments, patient demographics, and performance."
			/>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card className="p-6">
					<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground">
						Gender Distribution
					</h2>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={genderData}
								cx="50%"
								cy="50%"
								innerRadius={70}
								outerRadius={110}
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
							<Legend iconType="circle" verticalAlign="bottom" />
						</PieChart>
					</ResponsiveContainer>
				</Card>

				<Card className="p-6">
					<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground">
						Age Distribution
					</h2>
					<ResponsiveContainer width="100%" height={300}>
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

				<Card className="p-6">
					<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground">
						Monthly Appointments ({currentYear})
					</h2>
					<ResponsiveContainer width="100%" height={300}>
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

				<Card className="p-6">
					<h2 className="mb-5 border-b border-border pb-3 text-lg font-semibold text-foreground">
						Patient Ratings Over Time
					</h2>
					<ResponsiveContainer width="100%" height={300}>
						<ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
							<XAxis dataKey="date" name="Date" stroke={AXIS_COLOR} tick={{ fill: AXIS_COLOR }} tickLine={false} />
							<YAxis
								dataKey="rating"
								name="Rating"
								domain={[1, 5]}
								stroke={AXIS_COLOR}
								tick={{ fill: AXIS_COLOR }}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip cursor={{ strokeDasharray: "3 3", stroke: AXIS_COLOR }} contentStyle={tooltipContentStyle} />
							<Scatter name="Ratings" data={ratingData} fill={SERIES_COLOR} />
						</ScatterChart>
					</ResponsiveContainer>
				</Card>
			</div>
		</DashboardShell>
	);
}

export default DoctorAnalytics;
