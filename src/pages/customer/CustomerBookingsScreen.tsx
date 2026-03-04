import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  X,
  Star,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import toast from "react-hot-toast";

export default function CustomerBookingsScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const {
    bookings,
    bookingsLoading,
    bookingsHasMore,
    loadUserBookings,
    loadMoreUserBookings,
    cancelUserBooking,
    completeBookingUser,
  } = useBookingStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<typeof bookings[0] | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) loadUserBookings(user.id).catch(() => {}).finally(() => setInitialLoad(false));
  }, [user, loadUserBookings]);

  // Infinite scroll
  useEffect(() => {
    const el = observerRef.current;
    if (!el || !user?.id) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && bookingsHasMore && !bookingsLoading) {
          loadMoreUserBookings(user.id);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [bookingsHasMore, bookingsLoading, loadMoreUserBookings, user?.id]);

  if (!user || (initialLoad && bookingsLoading)) return <PageLoader />;

  const upcomingBookings = bookings.filter((b) => b.status === "confirmed");
  const pastBookings = bookings.filter((b) => b.status === "completed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

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
    if (!reviewBooking || !user) return;
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
    } catch {
      toast.error(t("common.error"));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "success" as const;
      case "completed": return "default" as const;
      case "cancelled": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  const BookingCard = ({ booking }: { booking: typeof bookings[0] }) => (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={booking.barberAvatar} />
            <AvatarFallback>{booking.barberName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm truncate">{booking.barberName}</h4>
              <Badge variant={statusVariant(booking.status)} className="text-[10px] shrink-0">
                {t(`status.${booking.status}`)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {booking.services
                .map((s) => s.icon + " " + (lang === "uz" ? s.nameUz : lang === "ru" ? s.nameRu : s.name))
                .join(", ")}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {booking.date}
              </span>
              <span>{booking.time}</span>
              <span className="font-semibold text-primary ml-auto">
                {booking.totalPrice.toLocaleString()} {t("common.currency")}
              </span>
            </div>
            {booking.status === "confirmed" && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setReviewBooking(booking);
                    setReviewRating(0);
                    setReviewComment("");
                  }}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t("profile.completeBooking")}
                </Button>
                <button
                  className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium border border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  onClick={() => setCancelId(booking.id)}
                >
                  <X className="h-3 w-3 mr-1" />
                  {t("profile.cancelBooking")}
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="px-4 py-4 animate-fade-in">
      <h2 className="font-bold text-lg mb-4">{t("customerApp.bookings")}</h2>

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1 text-xs">
            {t("profile.upcoming")} ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 text-xs">
            {t("profile.past")} ({pastBookings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 text-xs">
            {t("profile.cancelled")} ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>

        {[
          { key: "upcoming", items: upcomingBookings },
          { key: "past", items: pastBookings },
          { key: "cancelled", items: cancelledBookings },
        ].map(({ key, items }) => (
          <TabsContent key={key} value={key} className="mt-3 space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("profile.noBookings")}</p>
              </div>
            ) : (
              items.map((b) => <BookingCard key={b.id} booking={b} />)
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="py-4 flex justify-center">
        {bookingsLoading && !initialLoad && (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.cancelBooking")}</DialogTitle>
            <DialogDescription>{t("profile.cancelConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>{t("common.back")}</Button>
            <Button variant="destructive" onClick={handleCancel}>{t("common.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewBooking} onOpenChange={() => setReviewBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("profile.rateBarber")}</DialogTitle>
            <DialogDescription>
              {reviewBooking?.barberName} — {reviewBooking?.date} {reviewBooking?.time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("profile.yourRating")}</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewRating(star)} className="p-0.5 transition-transform hover:scale-110">
                    <Star className={`h-8 w-8 ${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("profile.yourReview")}</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder={t("profile.reviewPlaceholder")} rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setReviewBooking(null)}>{t("common.cancel")}</Button>
            <Button variant="ghost" onClick={handleCompleteSkip} disabled={reviewSubmitting}>{t("profile.skipReview")}</Button>
            <Button onClick={handleCompleteWithReview} disabled={reviewSubmitting || reviewRating === 0 || !reviewComment.trim()}>
              {reviewSubmitting ? t("common.loading") : t("profile.submitReview")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
