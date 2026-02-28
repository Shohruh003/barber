import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Scissors,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserNotificationStore } from "@/store/userNotificationStore";
import { cn } from "@/lib/utils";
import type { UserNotification } from "@/types";

const typeConfig: Record<UserNotification["type"], { icon: typeof Bell; color: string }> = {
  booking_confirmed: { icon: CheckCircle2, color: "text-green-500" },
  booking_cancelled: { icon: XCircle, color: "text-red-500" },
  booking_reminder: { icon: Clock, color: "text-orange-500" },
  visit_reminder: { icon: Scissors, color: "text-blue-500" },
};

export default function CustomerNotificationsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, loadNotifications, markRead, markAllRead } =
    useUserNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const grouped = notifications.reduce<Record<string, UserNotification[]>>((acc, n) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = t("customerApp.today");
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = t("customerApp.yesterday");
    } else {
      key = date.toISOString().slice(0, 10);
    }
    (acc[key] ||= []).push(n);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-bold">{t("customerApp.notifications")}</h1>
            {unreadCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-8 gap-1" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5" />
            {t("customerApp.markAllRead")}
          </Button>
        )}
      </div>

      <div className="px-4 pt-3 space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("customerApp.noNotifications")}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{date}</p>
              <div className="space-y-2">
                {items.map((notif) => {
                  const config = typeConfig[notif.type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className={cn(
                        "w-full text-left rounded-xl border p-3 flex gap-3 transition-all",
                        notif.isRead
                          ? "bg-background opacity-60"
                          : "bg-card border-primary/20 shadow-sm",
                      )}
                    >
                      <div className={cn("mt-0.5 shrink-0", config.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm", !notif.isRead && "font-semibold")}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString("uz", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="shrink-0 mt-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
