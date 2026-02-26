import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  X,
  Star,
  CheckCircle2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import toast from "react-hot-toast";

export default function Bookings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const {
    bookings,
    bookingsLoading,
    loadUserBookings,
    loadBarberBookings,
    cancelUserBooking,
    completeBookingUser,
  } = useBookingStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const [cancelId, setCancelId] = useState<string | null>(null);
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

  const datePlaceholder = lang === "uz" ? "kk.oo.yyyy" : lang === "ru" ? "дд.мм.гггг" : "dd.mm.yyyy";

  // Review dialog state
  const [reviewBooking, setReviewBooking] = useState<typeof bookings[0] | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === "barber") {
      loadBarberBookings(user.id);
    } else {
      loadUserBookings(user.id);
    }
  }, [user, loadUserBookings, loadBarberBookings]);

  if (!user) return <PageLoader />;

  const filtered = dateFilter
    ? bookings.filter((b) => b.date === toISODate(dateFilter))
    : bookings;

  const upcomingBookings = filtered.filter(
    (b) => b.status === "confirmed",
  );
  const pastBookings = filtered.filter((b) => b.status === "completed");
  const cancelledBookings = filtered.filter((b) => b.status === "cancelled");

  const handleCancel = async () => {
    if (!cancelId) return;
    await cancelUserBooking(cancelId);
    setCancelId(null);
    toast.success(t("common.success"));
  };

  const handleCompleteWithReview = async () => {
    if (!reviewBooking || !user) return;
    setReviewSubmitting(true);
    try {
      await completeBookingUser(reviewBooking.id, {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        barberId: reviewBooking.barberId,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success(t("profile.reviewSubmitted"));
      setReviewBooking(null);
      setReviewRating(0);
      setReviewComment("");
    } catch {
      toast.error(t("common.error"));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCompleteSkip = async () => {
    if (!reviewBooking) return;
    setReviewSubmitting(true);
    try {
      await completeBookingUser(reviewBooking.id, {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        barberId: reviewBooking.barberId,
        rating: 0,
        comment: "",
      });
      toast.success(t("common.success"));
      setReviewBooking(null);
      setReviewRating(0);
      setReviewComment("");
    } catch {
      toast.error(t("common.error"));
    } finally {
      setReviewSubmitting(false);
    }
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

  const BookingCard = ({ booking }: { booking: typeof bookings[0] }) => {
    // Sartarosh uchun — mijoz ma'lumotlari, mijoz uchun — sartarosh ma'lumotlari
    const isBarber = user.role === "barber";
    const displayName = isBarber ? (booking.userName || "Mijoz") : booking.barberName;
    const displayAvatar = isBarber ? booking.userAvatar : booking.barberAvatar;

    return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={displayAvatar} />
            <AvatarFallback>{displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium truncate">{displayName}</h4>
              <Badge variant={statusVariant(booking.status)}>
                {t(`status.${booking.status}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
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
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {booking.date}
              </span>
              <span>{booking.time}</span>
              <span className="font-semibold text-primary ml-auto">
                {booking.totalPrice.toLocaleString()} {t("common.currency")}
              </span>
            </div>
            {user.role === "user" && booking.status === "confirmed" && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => {
                    setReviewBooking(booking);
                    setReviewRating(0);
                    setReviewComment("");
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {t("profile.completeBooking")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setCancelId(booking.id)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  {t("profile.cancelBooking")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h2 className="text-2xl font-bold">{t("profile.myBookings")}</h2>
        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-auto justify-start text-left font-normal gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {dateFilter ? formatDate(dateFilter) : <span className="text-muted-foreground">{datePlaceholder}</span>}
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
            <Button variant="ghost" size="icon" onClick={() => setDateFilter(undefined)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {bookingsLoading ? (
        <PageLoader />
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              {t("profile.upcoming")} ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              {t("profile.past")} ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              {t("profile.cancelled")} ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcomingBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("profile.noBookings")}
              </p>
            ) : (
              upcomingBookings.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-3">
            {pastBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("profile.noBookings")}
              </p>
            ) : (
              pastBookings.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4 space-y-3">
            {cancelledBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("profile.noBookings")}
              </p>
            ) : (
              cancelledBookings.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.cancelBooking")}</DialogTitle>
            <DialogDescription>{t("profile.cancelConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              {t("common.back")}
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={!!reviewBooking}
        onOpenChange={() => setReviewBooking(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("profile.rateBarber")}</DialogTitle>
            <DialogDescription>
              {reviewBooking?.barberName} — {reviewBooking?.date}{" "}
              {reviewBooking?.time}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label>{t("profile.yourRating")}</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label>{t("profile.yourReview")}</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t("profile.reviewPlaceholder")}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewBooking(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="ghost"
              onClick={handleCompleteSkip}
              disabled={reviewSubmitting}
            >
              {t("profile.skipReview")}
            </Button>
            <Button
              onClick={handleCompleteWithReview}
              disabled={reviewSubmitting || reviewRating === 0 || !reviewComment.trim()}
            >
              {reviewSubmitting ? t("common.loading") : t("profile.submitReview")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
