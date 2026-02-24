import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageLoader } from "@/components/LoadingSpinner";
import { useBookingStore } from "@/store/bookingStore";
import toast from "react-hot-toast";

export default function AdminBookings() {
  const { t, i18n } = useTranslation();
  const {
    bookings,
    bookingsLoading,
    loadAllBookings,
    completeBookingAdmin,
    cancelUserBooking,
  } = useBookingStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const formatDate = (date: Date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
  };

  const toISODate = (date: Date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
  };

  const datePlaceholder =
    lang === "uz" ? "kk.oo.yyyy" : lang === "ru" ? "дд.мм.гггг" : "dd.mm.yyyy";

  useEffect(() => {
    loadAllBookings();
  }, [loadAllBookings]);

  if (bookingsLoading) return <PageLoader />;

  const filtered = dateFilter
    ? bookings.filter((b) => b.date === toISODate(dateFilter))
    : bookings;

  const confirmedCount = filtered.filter((b) => b.status === "confirmed").length;
  const completedCount = filtered.filter((b) => b.status === "completed").length;
  const cancelledCount = filtered.filter((b) => b.status === "cancelled").length;


  const handleCancel = async (bookingId: string) => {
    await cancelUserBooking(bookingId);
    toast.success(t("admin.bookingCancelled"));
  };

  const handleComplete = async (bookingId: string) => {
    await completeBookingAdmin(bookingId);
    toast.success(t("admin.bookingCompleted"));
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success" as const;
      case "completed":
        return "default" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-3xl font-bold">{t("admin.allBookings")}</h1>
        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-auto justify-start text-left font-normal gap-2"
              >
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {dateFilter ? (
                  formatDate(dateFilter)
                ) : (
                  <span className="text-muted-foreground">{datePlaceholder}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={(date) => {
                  setDateFilter(date);
                  setCalendarOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          {dateFilter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDateFilter(undefined)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {t("admin.totalBookings")}: {filtered.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="confirmed">
            <TabsList className="mb-4 flex-wrap">
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

            {["confirmed", "completed", "cancelled"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-0">
                {filtered.filter((b) => b.status === tab).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t("common.noResults")}
                  </p>
                ) : (
                  filtered
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
                            <Badge variant={statusVariant(booking.status)}>
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

                          {booking.status === "confirmed" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleComplete(booking.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                {t("admin.completeBooking")}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancel(booking.id)}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                {t("admin.cancelBooking")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
