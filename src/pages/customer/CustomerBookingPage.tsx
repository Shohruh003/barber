import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Card, CardContent } from "@/components/ui/card";
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

export default function CustomerBookingPage() {
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

  if (!user) { navigate("/login"); return null; }
  if (barbersLoading || !selectedBarber) return <PageLoader />;

  const barber = selectedBarber;

  if (!barber.isAvailable) {
    return (
      <div className="px-4 py-16 text-center animate-fade-in">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">{barber.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("barbers.unavailable")}</p>
        <Button onClick={() => navigate(-1)}>{t("common.back")}</Button>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const totalDuration = getTotalDuration();

  const getTimeSlots = () => {
    if (!selectedDate) return [];
    if (customDaySlots && customDaySlots.length > 0) {
      return customDaySlots.map((time) => ({
        time,
        available: !bookedSlots.includes(time),
      }));
    }
    return [];
  };

  const timeSlots = getTimeSlots();

  const getServiceName = (s: { name: string; nameUz: string; nameRu: string }) =>
    lang === "uz" ? s.nameUz : lang === "ru" ? s.nameRu : s.name;

  const handleConfirmBooking = async () => {
    if (selectedServices.length === 0 || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    try {
      await confirmBooking(user.id, barber, selectedServices, selectedDate, selectedTime, notes);
      setIsConfirmed(true);
      toast.success(t("booking.bookingConfirmed"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isConfirmed) {
    return (
      <div className="px-4 py-12 text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-1">{t("booking.bookingConfirmed")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("booking.bookingConfirmedMsg")}</p>

        <Card className="text-left mb-4">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={barber.avatar} />
                <AvatarFallback>{barber.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{barber.name}</p>
                <p className="text-xs text-muted-foreground">
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
              <span className="font-semibold text-primary">{totalPrice.toLocaleString()} {t("common.currency")}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/customer/bookings")}>
            {t("customerApp.bookings")}
          </Button>
          <Button className="flex-1" onClick={() => navigate("/customer/barbers")}>
            {t("customerApp.barbers")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-2 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-bold">{t("booking.title")}</h1>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}>
                {s}
              </div>
              {s < 3 && <div className={cn("h-0.5 w-10", s < step ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        {/* Step 1: Services */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold">{t("booking.selectService")}</h2>
            <ServiceSelector services={barber.services} selected={selectedServices} onToggle={toggleService} />
            <Button className="w-full h-11" disabled={selectedServices.length === 0} onClick={() => setStep(2)}>
              {t("common.next")}
            </Button>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
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
                        "flex flex-col items-center min-w-[64px] rounded-xl border p-2.5 transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : hasSlots
                            ? "border-border hover:border-primary/50"
                            : "border-border opacity-30 cursor-not-allowed",
                      )}
                    >
                      <span className="text-[10px] font-medium">{format(date, "EEE")}</span>
                      <span className="text-lg font-bold">{format(date, "dd")}</span>
                      <span className="text-[10px]">{format(date, "MMM")}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="space-y-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t("booking.selectTime")}
                </h2>
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">{t("barberPanel.noSlotsSet")}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "rounded-xl border py-2.5 text-sm font-medium transition-all",
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

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                {t("common.back")}
              </Button>
              <Button className="flex-1 h-11" disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}>
                {t("common.next")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("booking.confirmBooking")}
            </h2>

            {/* Summary */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={barber.avatar} />
                    <AvatarFallback>{barber.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{barber.name}</p>
                    <p className="text-xs text-muted-foreground">{lang === "uz" ? barber.locationUz : lang === "ru" ? barber.locationRu : barber.location}</p>
                  </div>
                </div>
                <Separator />
                {selectedServices.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span>{s.icon} {getServiceName(s)}</span>
                    <span className="text-muted-foreground">{s.price.toLocaleString()} {t("common.currency")}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("booking.date")}</span>
                  <span className="font-medium">{selectedDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("booking.time")}</span>
                  <span className="font-medium">{selectedTime} ({totalDuration} {t("booking.duration")})</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">{t("booking.price")}</span>
                  <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString()} {t("common.currency")}</span>
                </div>
              </CardContent>
            </Card>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("booking.notes")}</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("booking.notesPlaceholder")} className="h-11" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(2)}>
                {t("common.back")}
              </Button>
              <Button className="flex-1 h-11" onClick={handleConfirmBooking} disabled={isSubmitting}>
                {isSubmitting ? t("common.loading") : t("booking.confirmBooking")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
