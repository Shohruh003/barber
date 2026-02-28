import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Users,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/apiClient";

type StatusTab = "confirmed" | "completed" | "cancelled";

export default function BarberClientsScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "uz" | "ru";
  const { user } = useAuthStore();
  const { bookings, bookingsLoading, loadBarberBookings } = useBookingStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("confirmed");

  useEffect(() => {
    if (user?.id) loadBarberBookings(user.id);
  }, [user?.id, loadBarberBookings]);

  const filteredByStatus = useMemo(
    () => bookings.filter((b) => b.status === activeTab),
    [bookings, activeTab],
  );

  const filtered = useMemo(
    () =>
      filteredByStatus.filter((b) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const clientName = b.isManual ? b.guestName : b.userName;
        const clientPhone = b.isManual ? b.guestPhone : "";
        return (
          (clientName || "").toLowerCase().includes(q) ||
          (clientPhone || "").includes(q) ||
          b.date.includes(q)
        );
      }),
    [filteredByStatus, search],
  );

  const counts = useMemo(
    () => ({
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings],
  );

  const tabs: { key: StatusTab; label: string; color: string; activeColor: string }[] = [
    {
      key: "confirmed",
      label: t("status.confirmed"),
      color: "text-blue-500",
      activeColor: "border-blue-500 bg-blue-500/10 text-blue-500",
    },
    {
      key: "completed",
      label: t("status.completed"),
      color: "text-green-500",
      activeColor: "border-green-500 bg-green-500/10 text-green-500",
    },
    {
      key: "cancelled",
      label: t("status.cancelled"),
      color: "text-red-500",
      activeColor: "border-red-500 bg-red-500/10 text-red-500",
    },
  ];

  if (bookingsLoading) return <PageLoader />;

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("barberApp.searchClients")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 rounded-xl border p-2.5 text-center transition-all touch-target",
              activeTab === tab.key
                ? tab.activeColor + " font-semibold"
                : "border-border",
            )}
          >
            <p className="text-sm">{tab.label}</p>
            <p className="text-lg font-bold">{counts[tab.key]}</p>
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{filtered.length} {t("barberApp.bookings")}</span>
      </div>

      {/* Booking list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">{t("barberApp.noBookings")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((booking) => {
            const clientName = booking.isManual
              ? booking.guestName
              : booking.userName || t("barberApp.client");
            const clientPhone = booking.isManual ? booking.guestPhone : "";

            return (
              <Card key={booking.id}>
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getAvatarUrl(booking.userAvatar)} />
                      <AvatarFallback className="text-xs">
                        {(clientName || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{clientName}</p>
                        {booking.isManual && (
                          <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                            {t("barberApp.manual")}
                          </Badge>
                        )}
                      </div>
                      {clientPhone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{clientPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {booking.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {booking.time}
                    </span>
                  </div>

                  {booking.services.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {booking.services
                        .map(
                          (s) =>
                            s.icon +
                            " " +
                            (lang === "uz" ? s.nameUz : lang === "ru" ? s.nameRu : s.name),
                        )
                        .join(", ")}
                    </p>
                  )}

                  {booking.notes && (
                    <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                      "{booking.notes}"
                    </p>
                  )}
                  {booking.totalPrice > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {booking.totalDuration} {t("barberPanel.minutes")}
                      </span>
                      <span className="font-semibold text-primary">
                        {booking.totalPrice.toLocaleString()} {t("common.currency")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
