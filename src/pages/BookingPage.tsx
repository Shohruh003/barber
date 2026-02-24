import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, addDays, startOfDay } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ServiceSelector } from "@/components/ServiceSelector";
import { PageLoader } from "@/components/LoadingSpinner";
import { useBookingStore } from "@/store/bookingStore";
import { useAuthStore } from "@/store/authStore";
import { fetchBarberScheduledDates } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BookingPage() {
  const { barberId } = useParams<{ barberId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const {
    selectedBarber,
    barbersLoading,
    loadBarberById,
    selectedServices,
    selectedDate,
    selectedTime,
    bookedSlots,
    customDaySlots,
    toggleService,
    setSelectedDate,
    setSelectedTime,
    loadBookedSlots,
    confirmBooking,
    resetBookingFlow,
    getTotalPrice,
    getTotalDuration,
  } = useBookingStore();

  const [step, setStep] = useState(1);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);

  // Generate next 14 days
  const dates = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i)),
    [],
  );

  useEffect(() => {
    if (barberId) {
      loadBarberById(barberId);
      resetBookingFlow();
    }
  }, [barberId, loadBarberById, resetBookingFlow]);

  // Load which dates have barber-defined slots
  useEffect(() => {
    if (barberId) {
      const dateStrs = dates.map((d) => format(d, "yyyy-MM-dd"));
      fetchBarberScheduledDates(barberId, dateStrs).then(setScheduledDates);
    }
  }, [barberId, dates]);

  useEffect(() => {
    if (barberId && selectedDate) {
      loadBookedSlots(barberId, selectedDate);
    }
  }, [barberId, selectedDate, loadBookedSlots]);

  if (!user) {
    navigate("/login", { state: { from: `/booking/${barberId}` } });
    return null;
  }

  if (barbersLoading || !selectedBarber) return <PageLoader />;

  const barber = selectedBarber;

  // Block booking for unavailable barbers
  if (!barber.isAvailable) {
    return (
      <div className="container py-16 text-center animate-fade-in">
        <div className="mx-auto max-w-md space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{barber.name}</h1>
          <p className="text-muted-foreground">
            {t("barbers.unavailable")}
          </p>
          <Button asChild>
            <Link to="/barbers">{t("common.back")}</Link>
          </Button>
        </div>
      </div>
    );
  }
  const totalPrice = getTotalPrice();
  const totalDuration = getTotalDuration();

  // Get time slots for selected date — only barber-defined slots
  const getTimeSlots = () => {
    if (!selectedDate) return [];

    // Only show slots that the barber has explicitly set
    if (customDaySlots && customDaySlots.length > 0) {
      return customDaySlots.map((time) => ({
        time,
        available: !bookedSlots.includes(time),
      }));
    }

    // No custom slots = barber hasn't set schedule for this date
    return [];
  };

  const timeSlots = getTimeSlots();

  const getServiceName = (s: { name: string; nameUz: string; nameRu: string }) => {
    if (lang === "uz") return s.nameUz;
    if (lang === "ru") return s.nameRu;
    return s.name;
  };

  const handleConfirmBooking = async () => {
    if (selectedServices.length === 0 || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      await confirmBooking(
        user.id,
        barber,
        selectedServices,
        selectedDate,
        selectedTime,
        notes,
      );
      setIsConfirmed(true);
      toast.success(t("booking.bookingConfirmed"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="container py-16 text-center animate-fade-in">
        <div className="mx-auto max-w-md space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">{t("booking.bookingConfirmed")}</h1>
          <p className="text-muted-foreground">
            {t("booking.bookingConfirmedMsg")}
          </p>

          <Card>
            <CardContent className="p-6 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={barber.avatar} />
                  <AvatarFallback>{barber.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{barber.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedServices.map((s) => s.icon + " " + getServiceName(s)).join(", ")}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.date")}</span>
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.time")}</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.price")}</span>
                <span className="font-semibold text-primary">
                  {totalPrice.toLocaleString()} {t("common.currency")}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/bookings">{t("profile.myBookings")}</Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link to="/">{t("nav.home")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to={`/barbers/${barber.id}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("common.back")}
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Steps */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-2xl font-bold">{t("booking.title")}</h1>

          {/* Steps indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    s <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "h-0.5 w-12 sm:w-20",
                      s < step ? "bg-primary" : "bg-muted",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Services */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t("booking.selectService")}
              </h2>
              <ServiceSelector
                services={barber.services}
                selected={selectedServices}
                onToggle={toggleService}
              />
              <div className="flex justify-end">
                <Button
                  disabled={selectedServices.length === 0}
                  onClick={() => setStep(2)}
                >
                  {t("common.next")}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t("booking.selectDate")}
                </h2>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {dates.map((date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const hasSlots = scheduledDates.includes(dateStr);
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={dateStr}
                        disabled={!hasSlots}
                        onClick={() => setSelectedDate(dateStr)}
                        className={cn(
                          "flex flex-col items-center min-w-[72px] rounded-lg border p-3 transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : hasSlots
                              ? "border-border hover:border-primary/50"
                              : "border-border opacity-40 cursor-not-allowed",
                        )}
                      >
                        <span className="text-xs font-medium">
                          {format(date, "EEE")}
                        </span>
                        <span className="text-lg font-bold">
                          {format(date, "dd")}
                        </span>
                        <span className="text-xs">
                          {format(date, "MMM")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {t("booking.selectTime")}
                  </h2>
                  {timeSlots.length === 0 ? (
                    <p className="text-muted-foreground py-4">
                      {t("barberPanel.noSlotsSet")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={cn(
                            "rounded-lg border py-2.5 px-3 text-sm font-medium transition-all",
                            selectedTime === slot.time
                              ? "border-primary bg-primary text-primary-foreground"
                              : slot.available
                                ? "border-border hover:border-primary/50"
                                : "border-border opacity-30 cursor-not-allowed line-through",
                          )}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  {t("common.back")}
                </Button>
                <Button
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                >
                  {t("common.next")}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("booking.confirmBooking")}
              </h2>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("booking.notes")}
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("booking.notesPlaceholder")}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  {t("common.back")}
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? t("common.loading") : t("booking.confirmBooking")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right - Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">
                {t("booking.yourBooking")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={barber.avatar} />
                  <AvatarFallback>{barber.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{barber.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {lang === "uz"
                      ? barber.locationUz
                      : lang === "ru"
                        ? barber.locationRu
                        : barber.location}
                  </p>
                </div>
              </div>

              <Separator />

              {selectedServices.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">
                    {t("booking.service")}:
                  </span>
                  {selectedServices.map((s) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span>
                        {s.icon} {getServiceName(s)}
                      </span>
                      <span className="text-muted-foreground">
                        {s.price.toLocaleString()} {t("common.currency")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("booking.date")}
                  </span>
                  <span className="font-medium">{selectedDate}</span>
                </div>
              )}

              {selectedTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("booking.time")}
                  </span>
                  <span className="font-medium">
                    {selectedTime}
                    {totalDuration > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({totalDuration} {t("booking.duration")})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {selectedServices.length > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">{t("booking.price")}</span>
                    <span className="text-lg font-bold text-primary">
                      {totalPrice.toLocaleString()} {t("common.currency")}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
