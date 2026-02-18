import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  CalendarDays,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/LoadingSpinner";
import { useBookingStore } from "@/store/bookingStore";
import { mockBarbers } from "@/lib/mockData";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const {
    bookings,
    bookingsLoading,
    loadAllBookings,
    confirmBookingAdmin,
    completeBookingAdmin,
    cancelUserBooking,
    toggleBarberStatus,
  } = useBookingStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  useEffect(() => {
    loadAllBookings();
  }, [loadAllBookings]);

  if (bookingsLoading) return <PageLoader />;

  const totalRevenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  const stats = [
    {
      title: t("admin.totalBookings"),
      value: bookings.length,
      icon: <CalendarDays className="h-5 w-5" />,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: t("admin.totalBarbers"),
      value: mockBarbers.length,
      icon: <Users className="h-5 w-5" />,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: t("admin.totalRevenue"),
      value: totalRevenue.toLocaleString() + " " + t("common.currency"),
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: t("admin.confirmed"),
      value: confirmedCount,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  const statusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success" as const;
      case "pending":
        return "warning" as const;
      case "completed":
        return "default" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const handleConfirm = async (bookingId: string) => {
    await confirmBookingAdmin(bookingId);
    toast.success(t("admin.bookingConfirmed"));
  };

  const handleCancel = async (bookingId: string) => {
    await cancelUserBooking(bookingId);
    toast.success(t("admin.bookingCancelled"));
  };

  const handleComplete = async (bookingId: string) => {
    await completeBookingAdmin(bookingId);
    toast.success(t("admin.bookingCompleted"));
  };

  const handleToggleBarber = async (barberId: string) => {
    await toggleBarberStatus(barberId);
    toast.success(t("admin.barberStatusChanged"));
  };

  return (
    <div className="container py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">{t("admin.title")}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings Management - takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.allBookings")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList className="mb-4 flex-wrap">
                  <TabsTrigger value="pending">
                    {t("admin.pending")} ({pendingCount})
                  </TabsTrigger>
                  <TabsTrigger value="confirmed">
                    {t("admin.confirmed")} ({confirmedCount})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    {t("admin.completed")} ({completedCount})
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    {t("admin.cancelled")} ({cancelledCount})
                  </TabsTrigger>
                </TabsList>

                {["pending", "confirmed", "completed", "cancelled"].map(
                  (tab) => (
                    <TabsContent
                      key={tab}
                      value={tab}
                      className="space-y-3 mt-0"
                    >
                      {bookings.filter((b) => b.status === tab).length ===
                      0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          {t("common.noResults")}
                        </p>
                      ) : (
                        bookings
                          .filter((b) => b.status === tab)
                          .map((booking) => (
                            <div
                              key={booking.id}
                              className="flex items-start gap-3 rounded-lg border p-4"
                            >
                              <Avatar className="h-10 w-10 mt-0.5">
                                <AvatarImage src={booking.barberAvatar} />
                                <AvatarFallback>
                                  {booking.barberName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium truncate">
                                    {booking.barberName}
                                  </p>
                                  <Badge
                                    variant={statusVariant(booking.status)}
                                  >
                                    {t(`status.${booking.status}`)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {booking.services
                                    .map(
                                      (s) =>
                                        s.icon +
                                        " " +
                                        (lang === "uz"
                                          ? s.nameUz
                                          : lang === "ru"
                                            ? s.nameRu
                                            : s.name),
                                    )
                                    .join(", ")}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    {booking.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {booking.time}
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {booking.totalPrice.toLocaleString()}{" "}
                                    {t("common.currency")}
                                  </span>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 mt-3">
                                  {booking.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() =>
                                          handleConfirm(booking.id)
                                        }
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                        {t("admin.confirmBooking")}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                          handleCancel(booking.id)
                                        }
                                      >
                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                        {t("admin.cancelBooking")}
                                      </Button>
                                    </>
                                  )}
                                  {booking.status === "confirmed" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() =>
                                          handleComplete(booking.id)
                                        }
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                        {t("admin.completeBooking")}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                          handleCancel(booking.id)
                                        }
                                      >
                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                        {t("admin.cancelBooking")}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </TabsContent>
                  ),
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Barbers Management */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.manageBarbers")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockBarbers.map((barber) => (
                <div
                  key={barber.id}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={barber.avatar} />
                      <AvatarFallback>{barber.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{barber.name}</p>
                        <Badge
                          variant={
                            barber.isAvailable ? "success" : "secondary"
                          }
                        >
                          {barber.isAvailable
                            ? t("barbers.available")
                            : t("barbers.unavailable")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ⭐ {barber.rating} · {barber.reviewCount}{" "}
                        {t("barbers.reviews")} ·{" "}
                        {lang === "uz"
                          ? barber.locationUz
                          : lang === "ru"
                            ? barber.locationRu
                            : barber.location}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleToggleBarber(barber.id)}
                  >
                    {barber.isAvailable ? (
                      <ToggleRight className="h-4 w-4 mr-1.5 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 mr-1.5 text-muted-foreground" />
                    )}
                    {t("admin.toggleAvailability")}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
