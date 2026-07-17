import React, { useContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './screens/Navbar';
import PatientNavBar from './screens/Patients/PatientNavBar';  // Patient specific navbar
import DoctorNavBar from './screens/Doctors/DoctorNavBar';    // Doctor specific navbar
import RetailerNavBar from './screens/Retailers/RetailerNavBar'; // Retailer specific navbar
import AdminNavBar from './screens/admin/AdminNavbar';
import Footer from './screens/Footer';
import SanjeevaniChatbot from './components/SanjeevaniChatbot';
import BackToChatFab from './components/BackToChatFab';
import { AuthContext } from './context/AuthContext';

// Every screen is route-level, so it's only ever needed once the user
// actually navigates there — lazy-load them so the initial bundle isn't
// ~150 screens' worth of JS (see the Vite build warning this replaced).
const MobileChatApp = lazy(() => import('./screens/MobileChatApp'));
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const MedicinesScreen = lazy(() => import('./screens/Medicines'));
const DietYogaScreen = lazy(() => import('./screens/Patients/DietYogaComponent'));
const BlogsVideosScreen = lazy(() => import('./screens/BlogVideos/BlogsVideosScreen'));
const CartScreen = lazy(() => import('./screens/Cart'));
const PaymentScreen = lazy(() => import('./screens/Payment'));
const BlogScreen = lazy(() => import('./screens/Blogs'));
const Blog = lazy(() => import('./screens/BlogVideos/Blog'));
const DoctorsScreen = lazy(() => import('./screens/DoctorsScreen'));
const DoctorDetailPage = lazy(() => import('./screens/Patients/DoctorDetailPage'));
const DoctorReviewsPage = lazy(() => import('./screens/Doctors/DoctorReviewsPage'));
const SignInScreen = lazy(() => import('./screens/SignInScreen'));
const SignUpScreen = lazy(() => import('./screens/SignUpScreen'));
const SignUpPatientScreen = lazy(() => import('./screens/Patients/SignUpPatientScreen'));
const SignUpDoctorScreen = lazy(() => import('./screens/Doctors/SignUpDoctorScreen'));
const SignUpRetailerScreen = lazy(() => import('./screens/Retailers/SignUpRetailerScreen'));
const PrakritiDetermination = lazy(() => import('./screens/Patients/PrakritiDetermination'));
const TreatmentsScreen = lazy(() => import('./screens/Treatments'));
const AppointedDoctor = lazy(() => import('./screens/Patients/Appointments/AppointedDoctor'));
const PaymentPage = lazy(() => import('./screens/Patients/Appointments/PaymentPage'));
const PatientPage = lazy(() => import('./screens/Patients/PatientPage'));
const OrderHistory = lazy(() => import('./screens/Patients/OrderHistory'));
const DoctorHomeScreen = lazy(() => import('./screens/Doctors/DoctorHomeScreen'));
const DoctorAnalytics = lazy(() => import('./screens/Doctors/DoctorAnalytics'));
const CurrentRequests = lazy(() => import('./screens/Doctors/CurrentRequests'));
const AppointmentSlots = lazy(() => import('./screens/Doctors/AppointmentSlots'));
const PatientList = lazy(() => import('./screens/Doctors/PatientList'));
const HealthBlogs = lazy(() => import('./screens/Doctors/HealthBlogs'));
const TreatmentDetailsScreen = lazy(() => import('./screens/TreatmentDetailsScreen'));
const CheckoutScreen = lazy(() => import('./screens/CheckoutScreen'));

const AdminPage = lazy(() => import('./screens/admin/AdminPage'));
const AdminUsers = lazy(() => import('./screens/admin/AdminUsers'));
const AdminProfile = lazy(() => import('./screens/admin/AdminProfile'));
const AdminManagement = lazy(() => import('./screens/admin/AdminManagement'));
const AdminAuditLogs = lazy(() => import('./screens/admin/AdminAuditLogs'));
const AdminRetailers = lazy(() => import('./screens/admin/Retailer/AdminRetailers'));
const AdminBlogs = lazy(() => import('./screens/admin/AdminBlogs'));
const AdminBlogsUpdate = lazy(() => import('./screens/admin/AdminBlogsUpdate'));

const RetailerDashboard = lazy(() => import('./screens/Retailers/RetailerDashboard'));
const ManageProducts = lazy(() => import('./screens/Retailers/ManageProducts'));
const BulkMedicineUpload = lazy(() => import('./screens/Retailers/BulkMedicineUpload'));
const MyItems = lazy(() => import('./screens/Retailers/MyItems'));
const RetailerAnalytics = lazy(() => import('./screens/Retailers/RetailerAnalytics'));
const MyOrders = lazy(() => import('./screens/Retailers/MyOrders'));
const CustomerSupport = lazy(() => import('./screens/Retailers/CustomerSupport'));

const Notification = lazy(() => import('./screens/Patients/Notification')); // Patient notifications
const DoctorNotification = lazy(() => import('./screens/Doctors/DoctorNotification')); // Doctor notifications
const RetailerNotification = lazy(() => import('./screens/Retailers/RetailerNotification'));

const PatientFullDetails = lazy(() => import('./screens/admin/patient/PatientFullDetails'));
const DoctorFullDetails = lazy(() => import('./screens/admin/doctors/DoctorFullDetails'));
const Transactions = lazy(() => import('./screens/admin/transactions'));
const RetailerManagement = lazy(() => import('./screens/admin/Retailer/RetailerManagement'));
const Patientprofile = lazy(() => import('./screens/admin/patient/PatientProfile'));
const PatientProfileNew = lazy(() => import('./screens/Patients/PatientProfile')); // New patient profile
const DoctorProfileNew = lazy(() => import('./screens/Doctors/DoctorProfile'));    // New doctor profile
const RetailerProfileNew = lazy(() => import('./screens/Retailers/RetailerProfile')); // New retailer profile
const DoctorList = lazy(() => import('./screens/admin/doctors/DoctorList'));
const RetailerFullDetails = lazy(() => import('./screens/admin/Retailer/RetailerFullDetails'));
const PrescribeIndex = lazy(() => import('./screens/Doctors/doctorPrescribe/PrescribeIndex'));
const PatientFeedback = lazy(() => import('./screens/Patients/PatientFeedback'));
const BuyerFeedback = lazy(() => import('./screens/Patients/BuyerFeedback'));
const MedicineIdDetails = lazy(() => import('./screens/MedicineIdDetails'));
const PrakritiAssessment = lazy(() => import('./screens/Patients/PrakritiAssessment'));

function App() {
  const { auth } = useContext(AuthContext);

  // ── HASH-BASED PWA DETECTION ──────────────────────────────────────
  // When phone users visit jeevanhub.com/#chatbot, render ONLY the
  // full-screen chatbot. The hash is never sent to the server, so
  // no hosting rewrites/redirects are needed. Works on ANY platform.
  const isChatbotPWA = window.location.hash === '#chatbot' || window.location.hash === '#/chatbot';

  if (isChatbotPWA) {
    return (
      <Router>
        <Suspense fallback={null}>
          <MobileChatApp />
        </Suspense>
      </Router>
    );
  }

  // ── NORMAL WEBSITE FLOW ───────────────────────────────────────────
  const renderNavBar = () => {
    switch (auth.role) {
      case 'patient':
        return <PatientNavBar />;
      case 'doctor':
        return <DoctorNavBar />;
      case 'retailer':
        return <RetailerNavBar />;
      case 'admin':
        return <AdminNavBar />;
      default:
        return <NavBar />;
    }
  };

  return (
    <Router>
      {renderNavBar()}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/signin" element={<SignInScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/treatments" element={<TreatmentsScreen />} />
          <Route path="/treatment/:category" element={<TreatmentDetailsScreen />} />
          <Route path="/diet-yoga" element={<DietYogaScreen />} />
          <Route path="/blogs-videos" element={<BlogsVideosScreen />} />
          <Route path="/blogs" element={<BlogScreen />} />
          <Route path="/blog/:id" element={<Blog />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/payment" element={<PaymentScreen />} />
          <Route path="/doctors" element={<DoctorsScreen />} />
          <Route path="/doctor-detail" element={<DoctorDetailPage />} />
          <Route path="/medicines" element={<MedicinesScreen />} />
          <Route path="/medicines/:id" element={<MedicineIdDetails />} />

          <Route path="/signup-patient" element={<SignUpPatientScreen />} />
          <Route path="/signup-doctor" element={<SignUpDoctorScreen />} />
          <Route path="/signup-retailer" element={<SignUpRetailerScreen />} />
          <Route path="/prakritidetermination" element={<PrakritiDetermination />} />
          <Route path="/appointed-doctor" element={<AppointedDoctor />} />
          <Route path="/payment2" element={<PaymentPage />} />
          <Route path="/patient-home" element={<PatientPage />} />

          <Route path="/admin-home" element={<AdminPage />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/management" element={<AdminManagement />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin/consultations" element={<DoctorList />} />
          <Route path="/admin/blogs" element={<AdminBlogs />} />
          <Route path="/admin/blogs/update/:id" element={<AdminBlogsUpdate />} />
          <Route path="/patients/:id" element={<Patientprofile />} />
          <Route path="/admin/consultations/:id" element={<DoctorFullDetails />} />
          <Route path="/admin/transactions" element={<Transactions />} />
          <Route path="/admin/medicine-orders" element={<RetailerManagement />} />
          <Route path="/admin/users" element={<PatientFullDetails />} />
          <Route path="/admin/medicine-orders/:id" element={<RetailerFullDetails />} />

          <Route path="/profile/doctor/:id" element={<DoctorFullDetails />} />
          <Route path="/profile/retailer/:id" element={<RetailerFullDetails />} />
          <Route path="/profile/patient/:id" element={<Patientprofile />} />
          <Route path="/prakritiassessment" element={<PrakritiAssessment />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile/patient" element={<PatientProfileNew />} />
            <Route path="/profile/doctor" element={<DoctorProfileNew />} />
            <Route path="/profile/retailer" element={<RetailerProfileNew />} />
            <Route path="/current-requests" element={<CurrentRequests />} />

            <Route path="/PatientFeedback/:id" element={<PatientFeedback />} />
            <Route path="/BuyerFeedback/:id" element={<BuyerFeedback />} />
            <Route path="/doctorsprescribe/:bookingId" element={<PrescribeIndex />} />
            <Route path="/doctor-home" element={<DoctorHomeScreen />} />
            <Route path="/appointment-slots" element={<AppointmentSlots />} />
            <Route path="/doctor-analytics" element={<DoctorAnalytics />} />
            <Route path="/patient-list" element={<PatientList />} />
            <Route path="/health-blogs" element={<HealthBlogs />} />
            <Route path="/notifications" element={<Notification />} />

            <Route path="/retailer-home" element={<RetailerDashboard />} />
            <Route path="/doctor-notifications" element={<DoctorNotification />} />
            <Route path="/manage-products" element={<ManageProducts />}>
              <Route path="add" element={<BulkMedicineUpload />} />
              <Route path="items" element={<MyItems />} />
            </Route>
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/doctor-reviews" element={<DoctorReviewsPage />} />
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/retailer-analytics" element={<RetailerAnalytics />} />
            <Route path="/retailer-notifications" element={<RetailerNotification />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/customer-support" element={<CustomerSupport />} />
          </Route>
        </Routes>
      </Suspense>
      <Footer />
      <SanjeevaniChatbot />
      <BackToChatFab />
    </Router>
  );
}

export default App;
