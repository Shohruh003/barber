import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  CalendarCheck,
  DollarSign,
  Clock,
  CalendarX,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { cn } from "@/lib/utils";

export default function BarberStatsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookings, bookingsLoading, loadBarberBookings } = useBookingStore();

  useEffect(() => {
    if (user?.id) loadBarberBookings(user.id);
  }, [user?.id, loadBarberBookings]);

  // loadBarberBookings already filters by barberId, so no need to filter again
  const myBookings = bookings;

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.slice(0, 7);

    const confirmed = myBookings.filter((b) => b.status === "confirmed");
    const completed = myBookings.filter((b) => b.status === "completed");
    const cancelled = myBookings.filter((b) => b.status === "cancelled");
    const todayBookings = myBookings.filter((b) => b.date === today && b.status !== "cancelled");
    const monthBookings = myBookings.filter((b) => b.date.startsWith(thisMonth) && b.status !== "cancelled");

    const totalRevenue = completed.reduce((s, b) => s + b.totalPrice, 0);
    const monthRevenue = completed
      .filter((b) => b.date.startsWith(thisMonth))
      .reduce((s, b) => s + b.totalPrice, 0);

    const uniqueClients = new Set(
      myBookings
        .filter((b) => b.status !== "cancelled")
        .map((b) => b.userId || b.guestPhone || b.guestName),
    );

    // Service popularity
    const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const b of myBookings.filter((b) => b.status !== "cancelled")) {
      for (const s of b.services) {
        const key = s.nameUz || s.name;
        if (!serviceCount[key]) serviceCount[key] = { name: key, count: 0, revenue: 0 };
        serviceCount[key].count += 1;
        serviceCount[key].revenue += s.price;
      }
    }
    const topServices = Object.values(serviceCount).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      total: myBookings.length,
      confirmed: confirmed.length,
      completed: completed.length,
      cancelled: cancelled.length,
      todayCount: todayBookings.length,
      monthCount: monthBookings.length,
      totalRevenue,
      monthRevenue,
      uniqueClients: uniqueClients.size,
      topServices,
    };
  }, [myBookings]);

  if (bookingsLoading) return <PageLoader />;

  const statCards = [
    {
      icon: CalendarCheck,
      label: t("barberApp.todayBookings"),
      value: stats.todayCount,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: TrendingUp,
      label: t("barberApp.monthBookings"),
      value: stats.monthCount,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: Users,
      label: t("barberApp.totalClients"),
      value: stats.uniqueClients,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: DollarSign,
      label: t("barberApp.monthRevenue"),
      value: stats.monthRevenue.toLocaleString() + " " + t("common.currency"),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/barber/settings")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="font-bold text-lg">{t("barberApp.statistics")}</h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl mb-2", card.bg)}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking status breakdown */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <h3 className="font-semibold text-sm">{t("barberApp.bookingsByStatus")}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">{t("status.confirmed")}</span>
              </div>
              <Badge variant="outline">{stats.confirmed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">{t("status.completed")}</span>
              </div>
              <Badge variant="outline">{stats.completed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">{t("status.cancelled")}</span>
              </div>
              <Badge variant="outline">{stats.cancelled}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total revenue */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">{t("barberApp.totalRevenue")}</span>
            </div>
            <span className="text-xl font-bold text-primary">
              {stats.totalRevenue.toLocaleString()} {t("common.currency")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Top services */}
      {stats.topServices.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <h3 className="font-semibold text-sm">{t("barberApp.topServices")}</h3>
            <div className="space-y-2">
              {stats.topServices.map((service, i) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono w-5">#{i + 1}</span>
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {service.count}x
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {service.revenue.toLocaleString()} {t("common.currency")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="h-4" />
    </div>
  );
}
