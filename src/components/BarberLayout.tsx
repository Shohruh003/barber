import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Users, BarChart3, Bell, User, Scissors, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useBalanceModalStore } from "@/store/balanceModalStore";
import { PageLoader } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { fetchMyBalance } from "@/lib/apiClient";

export const TELEGRAM_BOT_URL = "https://t.me/barberbook_support_bot";
export const MIN_BALANCE = 10000;

const tabs = [
  { key: "schedule", icon: CalendarDays, path: "/barber/schedule" },
  { key: "myClients", icon: Users, path: "/barber/clients" },
  { key: "statistics", icon: BarChart3, path: "/barber/stats" },
  { key: "settings", icon: User, path: "/barber/settings" },
] as const;

export function BarberLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { setTheme } = useThemeStore();
  const { show: showLowBalanceModal, openModal, closeModal } = useBalanceModalStore();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("barber-theme-initialized")) {
      setTheme("dark");
      localStorage.setItem("barber-theme-initialized", "true");
    }
  }, [setTheme]);

  useEffect(() => {
    if (user?.id) loadNotifications(user.id);
  }, [user?.id, loadNotifications]);

  // Balansni bir marta tekshirish (session davomida)
  useEffect(() => {
    if (!user?.id) return;
    const dismissed = sessionStorage.getItem("balance-modal-dismissed");

    fetchMyBalance()
      .then((data) => {
        setBalance(data.balance);
        if (!dismissed && data.balance < MIN_BALANCE) {
          openModal();
        }
      })
      .catch(() => {});
  }, [user?.id, openModal]);

  const handleTopUp = () => {
    closeModal();
    window.open(TELEGRAM_BOT_URL, "_blank");
  };

  const handleDismiss = () => {
    sessionStorage.setItem("balance-modal-dismissed", "1");
    closeModal();
  };

  const unread = user?.id ? unreadCount() : 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur safe-area-top shrink-0">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            BarberBook
          </span>
        </div>
        <div className="flex items-center gap-2">
          {balance !== null && (
            <button
              onClick={openModal}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>{balance.toLocaleString()} so'm</span>
            </button>
          )}
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
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>

      {/* Bottom tab bar */}
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
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className={`${isActive ? "h-6 w-6" : "h-5 w-5"} transition-all`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                  {t(`barberApp.${tab.key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Kam balans modali */}
      {showLowBalanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <Wallet className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-lg font-bold">Hisobingizni to'ldiring</h2>
              <p className="text-sm text-muted-foreground">
                Joriy balans: <span className="font-semibold text-foreground">{balance?.toLocaleString() ?? 0} so'm</span>
                <br />
                Minimal: <span className="font-semibold text-foreground">{MIN_BALANCE.toLocaleString()} so'm</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Balans yetarli bo'lmasa mijozlar sizni ko'ra olmaydi va jadval yarata olmaysiz.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Button className="w-full" onClick={handleTopUp}>
                💳 To'ldirish (Telegram bot)
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleDismiss}>
                Keyinroq
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
