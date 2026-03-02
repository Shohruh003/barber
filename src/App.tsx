import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy, useState } from "react";
import { Scissors } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BarberLayout } from "@/components/BarberLayout";
import { CustomerLayout } from "@/components/CustomerLayout";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));

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

function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur safe-area-top">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            BarberBook
          </span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function AppRoutes() {
  const { user, token, loadUser } = useAuthStore();

  const [initializing] = useState(() => {
    if (token && !user) {
      loadUser();
      return true;
    }
    return false;
  });

  if (initializing && !user) return <PageLoader />;

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
          <Route path="*" element={<Navigate to="/customer/map" replace />} />
        </Routes>
      </CustomerLayout>
    );
  }

  // Admin layout
  if (user?.role === "admin") {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/barbers" element={<AdminBarbers />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

  // Unauthenticated — login/register
  return (
    <div className="flex min-h-screen flex-col">
      <AuthHeader />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </main>
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
