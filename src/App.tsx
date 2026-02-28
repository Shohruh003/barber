import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BarberLayout } from "@/components/BarberLayout";
import { CustomerLayout } from "@/components/CustomerLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";

// Public / User pages
const Home = lazy(() => import("@/pages/Home"));
const BarbersList = lazy(() => import("@/pages/BarbersList"));
const BarberDetail = lazy(() => import("@/pages/BarberDetail"));
const BookingPage = lazy(() => import("@/pages/BookingPage"));
const Profile = lazy(() => import("@/pages/Profile"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminBookings = lazy(() => import("@/pages/AdminBookings"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminBarbers = lazy(() => import("@/pages/AdminBarbers"));

// Barber mobile pages
const BarberScheduleScreen = lazy(() => import("@/pages/barber/BarberScheduleScreen"));
const BarberClientsScreen = lazy(() => import("@/pages/barber/BarberClientsScreen"));
const BarberNotificationsScreen = lazy(() => import("@/pages/barber/BarberNotificationsScreen"));
const BarberSettingsScreen = lazy(() => import("@/pages/barber/BarberSettingsScreen"));
const BarberProfileEditScreen = lazy(() => import("@/pages/barber/BarberProfileEditScreen"));
const BarberStatsScreen = lazy(() => import("@/pages/barber/BarberStatsScreen"));

// Customer mobile pages
const CustomerMapScreen = lazy(() => import("@/pages/customer/CustomerMapScreen"));
const CustomerBarbersScreen = lazy(() => import("@/pages/customer/CustomerBarbersScreen"));
const CustomerBookingsScreen = lazy(() => import("@/pages/customer/CustomerBookingsScreen"));
const CustomerSettingsScreen = lazy(() => import("@/pages/customer/CustomerSettingsScreen"));
const CustomerBarberDetailScreen = lazy(() => import("@/pages/customer/CustomerBarberDetailScreen"));
const CustomerBookingPage = lazy(() => import("@/pages/customer/CustomerBookingPage"));
const CustomerNotificationsScreen = lazy(() => import("@/pages/customer/CustomerNotificationsScreen"));
const CustomerAIStyleScreen = lazy(() => import("@/pages/customer/CustomerAIStyleScreen"));

function AppRoutes() {
  const { user } = useAuthStore();

  // Barber mobile layout
  if (user?.role === "barber") {
    return (
      <BarberLayout>
        <Routes>
          <Route path="/barber/schedule" element={<BarberScheduleScreen />} />
          <Route path="/barber/clients" element={<BarberClientsScreen />} />
          <Route path="/barber/notifications" element={<BarberNotificationsScreen />} />
          <Route path="/barber/settings" element={<BarberSettingsScreen />} />
          <Route path="/barber/profile-edit" element={<BarberProfileEditScreen />} />
          <Route path="/barber/stats" element={<BarberStatsScreen />} />
          <Route path="/login" element={<Navigate to="/barber/schedule" replace />} />
          <Route path="*" element={<Navigate to="/barber/schedule" replace />} />
        </Routes>
      </BarberLayout>
    );
  }

  // Customer mobile layout
  if (user?.role === "user") {
    return (
      <CustomerLayout>
        <Routes>
          <Route path="/customer/map" element={<CustomerMapScreen />} />
          <Route path="/customer/barbers" element={<CustomerBarbersScreen />} />
          <Route path="/customer/barber/:id" element={<CustomerBarberDetailScreen />} />
          <Route path="/customer/booking/:barberId" element={<CustomerBookingPage />} />
          <Route path="/customer/bookings" element={<CustomerBookingsScreen />} />
          <Route path="/customer/settings" element={<CustomerSettingsScreen />} />
          <Route path="/customer/notifications" element={<CustomerNotificationsScreen />} />
          <Route path="/customer/ai-style" element={<CustomerAIStyleScreen />} />
          <Route path="/login" element={<Navigate to="/customer/map" replace />} />
          <Route path="/register" element={<Navigate to="/customer/map" replace />} />
          <Route path="*" element={<Navigate to="/customer/map" replace />} />
        </Routes>
      </CustomerLayout>
    );
  }

  // Default layout (admin, unauthenticated)
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/barbers" element={<BarbersList />} />
            <Route path="/barbers/:id" element={<BarberDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/booking/:barberId"
              element={<ProtectedRoute><BookingPage /></ProtectedRoute>}
            />
            <Route
              path="/bookings"
              element={<ProtectedRoute><Bookings /></ProtectedRoute>}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>}
            />
            <Route
              path="/admin/bookings"
              element={<ProtectedRoute adminOnly><AdminBookings /></ProtectedRoute>}
            />
            <Route
              path="/admin/users"
              element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>}
            />
            <Route
              path="/admin/barbers"
              element={<ProtectedRoute adminOnly><AdminBarbers /></ProtectedRoute>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          className: "!bg-card !text-card-foreground !border !shadow-lg",
          duration: 3000,
        }}
      />
    </Router>
  );
}

export default App;
