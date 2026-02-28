import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CalendarPlus, CalendarX, Phone, Clock, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { PageLoader } from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";
import type { BarberNotification } from "@/types";

const typeConfig = {
  new_booking: { icon: CalendarPlus, color: "text-blue-500", border: "border-l-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/5" },
  booking_cancelled: { icon: CalendarX, color: "text-red-500", border: "border-l-red-500", bg: "bg-red-500/10 dark:bg-red-500/5" },
  manual_booking: { icon: Phone, color: "text-green-500", border: "border-l-green-500", bg: "bg-green-500/10 dark:bg-green-500/5" },
  reminder: { icon: Clock, color: "text-orange-500", border: "border-l-orange-500", bg: "bg-orange-500/10 dark:bg-orange-500/5" },
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(
  items: BarberNotification[],
  t: (key: string) => string,
): { label: string; items: BarberNotification[] }[] {
  const groups: Record<string, BarberNotification[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const n of items) {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) {
      label = t("barberApp.today");
    } else if (d.getTime() === yesterday.getTime()) {
      label = t("barberApp.yesterday");
    } else {
      label = d.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export default function BarberNotificationsScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { notifications, loading, loadNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    if (user?.id) loadNotifications(user.id);
  }, [user?.id, loadNotifications]);

  if (loading) return <PageLoader />;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const grouped = groupByDate(notifications, t);

  return (
    <div className="animate-fade-in min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg">{t("barberApp.notifications")}</h2>
            {unreadCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => user?.id && markAllRead(user.id)}
              className="text-xs text-primary h-8 gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("barberApp.markAllRead")}
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground font-medium">{t("barberApp.noNotifications")}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {t("barberApp.noNotificationsHint")}
          </p>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-5">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.new_booking;
                  const Icon = config.icon;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className={cn(
                        "w-full text-left rounded-xl border-l-[3px] p-3.5 transition-all",
                        config.border,
                        !notif.isRead ? config.bg : "bg-card",
                        !notif.isRead ? "shadow-sm" : "opacity-70",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("shrink-0 mt-0.5 rounded-lg p-1.5", !notif.isRead ? config.bg : "bg-muted/50")}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-sm leading-tight", !notif.isRead ? "font-semibold" : "font-medium text-muted-foreground")}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground/70 shrink-0 mt-0.5">
                              {formatTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
