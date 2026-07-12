import React, { useState, useEffect } from "react";
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
  ResponsiveContainer
} from "recharts";
import "./DoctorAnalytics.css";
import { authFetch } from "../../utils/authFetch";

// Customized label for Pie/Donut Chart
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
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

const PIE_COLORS = ["#6366F1", "#14B8A6", "#F59E0B"];
const LINE_COLOR = "#8B5CF6";
const BAR_COLOR = "#3B82F6";
const SCATTER_COLOR = "#EC4899";

function DoctorAnalytics() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const email = localStorage.getItem("email");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/bookings/bookings`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const data = await response.json();
        const doctorBookings = data.bookings.filter(
          (booking) => booking.doctorEmail === email
        );
        setBookings(doctorBookings);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchBookings();
  }, [email]);

  // Data for Gender Pie Chart
  const genderData = [
    { name: "Male", value: bookings.filter((b) => b.patientGender === "Male").length },
    { name: "Female", value: bookings.filter((b) => b.patientGender === "Female").length },
    { name: "Other", value: bookings.filter((b) => b.patientGender === "Other").length },
  ].filter(d => d.value > 0); // Only show segments with data

  // Data for Age Line Graph
  const ageData = [
    { ageGroup: "0-10", count: bookings.filter((b) => b.patientAge >= 0 && b.patientAge <= 10).length },
    { ageGroup: "11-20", count: bookings.filter((b) => b.patientAge >= 11 && b.patientAge <= 20).length },
    { ageGroup: "21-30", count: bookings.filter((b) => b.patientAge >= 21 && b.patientAge <= 30).length },
    { ageGroup: "31-40", count: bookings.filter((b) => b.patientAge >= 31 && b.patientAge <= 40).length },
    { ageGroup: "41-50", count: bookings.filter((b) => b.patientAge >= 41 && b.patientAge <= 50).length },
    { ageGroup: "51+", count: bookings.filter((b) => b.patientAge >= 51).length },
  ];

  // Data for Monthly Bar Graph
  const currentYear = new Date().getFullYear();
  const currentYearBookings = bookings.filter(
    (booking) => new Date(booking.dateOfAppointment).getFullYear() === currentYear
  );

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    return {
      month: new Date(currentYear, i).toLocaleString("default", { month: "short" }),
      count: currentYearBookings.filter(
        (booking) => new Date(booking.dateOfAppointment).getMonth() === i
      ).length,
    };
  });

  // Data for Rating Scatter Plot
  const ratingData = bookings
    .filter((b) => b.rating !== null)
    .map((b) => ({ rating: b.rating, date: new Date(b.dateOfAppointment).toLocaleDateString() }));

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading your analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="doctor-analytics-container">
      <div className="analytics-header">
        <h1>Dashboard Overview</h1>
        <p>Track your appointments, patient demographics, and performance.</p>
      </div>

      <div className="dashboard-grid">
        {/* Gender Pie Chart */}
        <div className="chart-card">
          <h2>Gender Distribution</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={false}
                  stroke="none"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                />
                <Legend iconType="circle" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Line Graph */}
        <div className="chart-card">
          <h2>Age Distribution</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="ageGroup" stroke="#6b7280" tick={{ fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                />
                <Line type="monotone" dataKey="count" name="Patients" stroke={LINE_COLOR} strokeWidth={3} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Bar Graph */}
        <div className="chart-card">
          <h2>Monthly Appointments ({currentYear})</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="count" name="Appointments" fill={BAR_COLOR} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rating Scatter Plot */}
        <div className="chart-card">
          <h2>Patient Ratings Over Time</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" name="Date" stroke="#6b7280" tick={{ fill: '#6b7280' }} tickLine={false} />
                <YAxis dataKey="rating" name="Rating" domain={[1, 5]} stroke="#6b7280" tick={{ fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                />
                <Scatter name="Ratings" data={ratingData} fill={SCATTER_COLOR} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorAnalytics;
