import { Suspense, useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Scissors, CalendarDays, Sparkles, Settings, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useUserNotificationStore } from "@/store/userNotificationStore";
import { PageLoader } from "@/components/LoadingSpinner";

const tabs = [
  { key: "map", icon: MapPin, path: "/customer/map" },
  { key: "barbers", icon: Scissors, path: "/customer/barbers" },
  { key: "aiStyle", icon: Sparkles, path: "/customer/ai-style" },
  { key: "bookings", icon: CalendarDays, path: "/customer/bookings" },
  { key: "settings", icon: Settings, path: "/customer/settings" },
] as const;

export function CustomerLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setTheme } = useThemeStore();
  const { loadFavoriteIds } = useFavoritesStore();
  const { unreadCount, loadNotifications } = useUserNotificationStore();

  // Dark mode default for customers (first time only)
  useEffect(() => {
    if (!localStorage.getItem("customer-theme-initialized")) {
      setTheme("dark");
      localStorage.setItem("customer-theme-initialized", "true");
    }
  }, [setTheme]);

  // Load favorite IDs and notifications on mount
  useEffect(() => {
    if (user?.id) {
      loadFavoriteIds();
      loadNotifications();
    }
  }, [user?.id, loadFavoriteIds, loadNotifications]);

  const unread = unreadCount;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header with notification bell */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur safe-area-top shrink-0">
        <span className="font-bold text-lg bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          BarberBook
        </span>
        <button
          onClick={() => navigate("/customer/notifications")}
          className="relative flex items-center justify-center h-9 w-9"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unread > 0 && (
            <span className="absolute top-0 right-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-background px-1">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>

      {/* Fixed bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur safe-area-bottom bottom-nav">
        <div className="flex h-16 items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive =
              location.pathname === tab.path ||
              (tab.key === "barbers" && (
                location.pathname.startsWith("/customer/barber/") ||
                location.pathname.startsWith("/customer/booking/")
              ));
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center gap-0.5 touch-target px-3 py-1 rounded-xl transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`${isActive ? "h-6 w-6" : "h-5 w-5"} transition-all`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                  {t(`customerApp.${tab.key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
