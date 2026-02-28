import { Suspense, useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Users, Bell, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { PageLoader } from "@/components/LoadingSpinner";

const tabs = [
  { key: "schedule", icon: CalendarDays, path: "/barber/schedule" },
  { key: "myClients", icon: Users, path: "/barber/clients" },
  { key: "notifications", icon: Bell, path: "/barber/notifications" },
  { key: "settings", icon: Settings, path: "/barber/settings" },
] as const;

export function BarberLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { setTheme } = useThemeStore();

  // Dark mode default for barbers (first time only)
  useEffect(() => {
    if (!localStorage.getItem("barber-theme-initialized")) {
      setTheme("dark");
      localStorage.setItem("barber-theme-initialized", "true");
    }
  }, [setTheme]);

  // Load notifications
  useEffect(() => {
    if (user?.id) loadNotifications(user.id);
  }, [user?.id, loadNotifications]);

  const unread = user?.id ? unreadCount() : 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur safe-area-top shrink-0">
        <span className="font-bold text-lg bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          BarberBook
        </span>
        <button
          onClick={() => navigate("/barber/notifications")}
          className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unread > 0 && (
            <span className="absolute top-0 right-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-background">
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
            const isActive = location.pathname === tab.path;
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
                <div className="relative">
                  <Icon className={`${isActive ? "h-6 w-6" : "h-5 w-5"} transition-all`} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.key === "notifications" && unread > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                  {t(`barberApp.${tab.key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
