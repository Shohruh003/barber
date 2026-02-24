import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/LoadingSpinner";

const Home = lazy(() => import("@/pages/Home"));
const BarbersList = lazy(() => import("@/pages/BarbersList"));
const BarberDetail = lazy(() => import("@/pages/BarberDetail"));
const BookingPage = lazy(() => import("@/pages/BookingPage"));
const Profile = lazy(() => import("@/pages/Profile"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminBookings = lazy(() => import("@/pages/AdminBookings"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminBarbers = lazy(() => import("@/pages/AdminBarbers"));
const BarberPanel = lazy(() => import("@/pages/BarberPanel"));
const BarberDashboard = lazy(() => import("@/pages/BarberDashboard"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function App() {
  return (
    <Router>
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
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <Bookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/barbers"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminBarbers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/barber-panel"
                element={
                  <ProtectedRoute adminOnly>
                    <BarberPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/barber/dashboard"
                element={
                  <ProtectedRoute adminOnly>
                    <BarberDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
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
