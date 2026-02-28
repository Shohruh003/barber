import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, addDays, startOfDay } from "date-fns";
import {
  Clock,
  Plus,
  Save,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBarberScheduleStore } from "@/store/barberScheduleStore";
import { useBookingStore } from "@/store/bookingStore";
import { generateTimeSlots } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/apiClient";
import { ManualBookingDialog } from "@/components/ManualBookingDialog";
import toast from "react-hot-toast";

export default function BarberScheduleScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const lang = i18n.language as "en" | "uz" | "ru";
  const {
    barber,
    barberLoading,
    loadBarber,
    daySchedule,
    blockedSlots,
    scheduleLoading,
    loadDaySchedule,
    saveDaySchedule,
    toggleBlock,
    updateSlotDuration,
  } = useBarberScheduleStore();

  const { bookings, loadBarberBookings, toggleBarberStatus, cancelUserBooking } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editSlots, setEditSlots] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showDuration, setShowDuration] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [slotAction, setSlotAction] = useState<{ time: string; status: string } | null>(null);

  // Slot generator
  const [genFrom, setGenFrom] = useState("09:00");
  const [genTo, setGenTo] = useState("19:00");
  const [lunchFrom, setLunchFrom] = useState("13:00");
  const [lunchTo, setLunchTo] = useState("14:00");
  const [skipLunch, setSkipLunch] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState("");

  // Duration
  const [tempDuration, setTempDuration] = useState(30);

  useEffect(() => {
    if (user) {
      loadBarber(user.id);
      loadBarberBookings(user.id);
    }
  }, [user, loadBarber, loadBarberBookings]);

  useEffect(() => {
    if (barber) setTempDuration(barber.slotDuration);
  }, [barber]);

  useEffect(() => {
    if (user && selectedDate) loadDaySchedule(user.id, selectedDate);
  }, [user, selectedDate, loadDaySchedule]);

  useEffect(() => {
    if (daySchedule) {
      setEditSlots([...daySchedule.slots]);
    } else {
      setEditSlots([]);
    }
    setIsEditing(false);
  }, [daySchedule]);

  const dates = useMemo(
    () => Array.from({ length: 30 }, (_, i) => addDays(startOfDay(new Date()), i)),
    [],
  );

  const todayBookings = useMemo(
    () => bookings.filter((b) => b.date === selectedDate && b.status !== "cancelled"),
    [bookings, selectedDate],
  );

  const bookedTimes = useMemo(() => todayBookings.map((b) => b.time), [todayBookings]);
  const blockedTimes = useMemo(() => blockedSlots.map((s) => s.time), [blockedSlots]);

  const availableSlots = useMemo(
    () => editSlots.filter((s) => !bookedTimes.includes(s) && !blockedTimes.includes(s)),
    [editSlots, bookedTimes, blockedTimes],
  );

  if (barberLoading || !barber) return <PageLoader />;

  const getSlotStatus = (time: string) => {
    if (bookedTimes.includes(time)) return "booked";
    if (blockedTimes.includes(time)) return "blocked";
    return "available";
  };

  const handleGenerateSlots = () => {
    const allSlots = generateTimeSlots(genFrom, genTo, barber.slotDuration, []);
    let slots = allSlots.map((s) => s.time);
    if (!skipLunch && lunchFrom && lunchTo) {
      const lStart = toMinutes(lunchFrom);
      const lEnd = toMinutes(lunchTo);
      slots = slots.filter((t) => toMinutes(t) < lStart || toMinutes(t) >= lEnd);
    }
    setEditSlots(slots);
    setIsEditing(true);
    setShowGenerator(false);
  };

  const handleRemoveSlot = async (time: string) => {
    const updated = editSlots.filter((s) => s !== time);
    setEditSlots(updated);
    await saveDaySchedule({ barberId: barber.id, date: selectedDate, slots: updated });
    setIsEditing(false);
    toast.success(t("barberPanel.slotRemoved"));
  };

  const handleAddSlot = async () => {
    if (!newSlotTime || editSlots.includes(newSlotTime)) return;
    const updated = [...editSlots, newSlotTime].sort();
    setEditSlots(updated);
    setNewSlotTime("");
    await saveDaySchedule({ barberId: barber.id, date: selectedDate, slots: updated });
    toast.success(t("barberPanel.slotAdded"));
  };

  const handleSaveSchedule = async () => {
    await saveDaySchedule({ barberId: barber.id, date: selectedDate, slots: editSlots });
    setIsEditing(false);
    toast.success(t("barberPanel.scheduleSaved"));
  };

  const handleToggleBlock = async (time: string) => {
    await toggleBlock(barber.id, selectedDate, time);
    toast.success(blockedTimes.includes(time) ? t("barberPanel.slotUnblocked") : t("barberPanel.slotBlocked"));
  };

  const handleToggleAvailability = async () => {
    await toggleBarberStatus(barber.id);
    await loadBarber(barber.id);
    toast.success(t("admin.barberStatusChanged"));
  };

  const handleSaveDuration = async () => {
    await updateSlotDuration(barber.id, tempDuration);
    setShowDuration(false);
    toast.success(t("common.success"));
  };

  const handleCancelBooking = async () => {
    if (!cancelId) return;
    try {
      await cancelUserBooking(cancelId);
      if (user) {
        loadBarberBookings(user.id);
        loadDaySchedule(user.id, selectedDate);
      }
      toast.success(t("admin.bookingCancelled"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setCancelId(null);
    }
  };

  const handleManualSuccess = () => {
    if (user) {
      loadBarberBookings(user.id);
      loadDaySchedule(user.id, selectedDate);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Availability toggle */}
      <button
        onClick={handleToggleAvailability}
        className={cn(
          "w-full flex items-center justify-between rounded-xl p-4 transition-all border",
          barber.isAvailable
            ? "bg-green-500/10 border-green-500/30"
            : "bg-muted border-border",
        )}
      >
        <div className="flex items-center gap-3">
          {barber.isAvailable ? (
            <ToggleRight className="h-7 w-7 text-green-500" />
          ) : (
            <ToggleLeft className="h-7 w-7 text-muted-foreground" />
          )}
          <div className="text-left">
            <p className="font-semibold">{t("barberApp.availability")}</p>
            <p className="text-xs text-muted-foreground">
              {barber.isAvailable ? t("barbers.available") : t("barbers.unavailable")}
            </p>
          </div>
        </div>
        <Badge variant={barber.isAvailable ? "success" : "secondary"}>
          {barber.isAvailable ? "ON" : "OFF"}
        </Badge>
      </button>

      {/* Date selector (horizontal scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {dates.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={cn(
                "flex flex-col items-center min-w-[64px] rounded-xl border p-2.5 transition-all touch-target shrink-0",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/50",
                isToday && !isSelected && "border-primary/40",
              )}
            >
              <span className="text-[10px] font-medium uppercase">{format(date, "EEE")}</span>
              <span className="text-lg font-bold">{format(date, "dd")}</span>
              <span className="text-[10px]">{format(date, "MMM")}</span>
            </button>
          );
        })}
      </div>

      {/* Quick actions: Generate + Duration + Add slot */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10"
          onClick={() => setShowGenerator(!showGenerator)}
        >
          <Clock className="h-4 w-4 mr-1" />
          {t("barberPanel.generateSlots")}
          {showGenerator ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-10"
          onClick={() => setShowDuration(!showDuration)}
        >
          {barber.slotDuration} {t("barberPanel.minutes")}
        </Button>
      </div>

      {/* Collapsible: Slot generator */}
      {showGenerator && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("barberPanel.from")}</Label>
                <Input type="time" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("barberPanel.to")}</Label>
                <Input type="time" value={genTo} onChange={(e) => setGenTo(e.target.value)} className="h-10" />
              </div>
              {!skipLunch && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("barberPanel.lunchStart")}</Label>
                    <Input type="time" value={lunchFrom} onChange={(e) => setLunchFrom(e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("barberPanel.lunchEnd")}</Label>
                    <Input type="time" value={lunchTo} onChange={(e) => setLunchTo(e.target.value)} className="h-10" />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={skipLunch} onChange={(e) => setSkipLunch(e.target.checked)} className="rounded" />
                {t("barberPanel.skipLunch")}
              </label>
              <Button size="sm" onClick={handleGenerateSlots}>
                {t("barberPanel.generateSlots")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collapsible: Duration */}
      {showDuration && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              {[15, 20, 30, 45, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setTempDuration(d)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-all touch-target",
                    tempDuration === d ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {d}
                </button>
              ))}
              <Button size="sm" onClick={handleSaveDuration}>
                <Save className="h-4 w-4 mr-1" />
                {t("common.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slots Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{selectedDate}</h3>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={newSlotTime}
              onChange={(e) => setNewSlotTime(e.target.value)}
              className="w-28 h-9"
            />
            <Button variant="outline" size="sm" onClick={handleAddSlot} className="h-9">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />{t("barberPanel.available")}</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />{t("barberPanel.booked")}</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />{t("barberPanel.blocked")}</span>
        </div>

        {scheduleLoading ? (
          <PageLoader />
        ) : editSlots.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>{t("barberPanel.noSchedule")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {editSlots.map((time) => {
              const status = getSlotStatus(time);
              return (
                <button
                  key={time}
                  onClick={() => setSlotAction({ time, status })}
                  className={cn(
                    "relative flex items-center justify-center rounded-xl border p-3 text-sm font-semibold transition-all touch-target",
                    status === "booked" && "border-blue-400/50 bg-blue-500/10 text-blue-400",
                    status === "blocked" && "border-red-400/50 bg-red-500/10 text-red-400",
                    status === "available" && "border-green-400/50 bg-green-500/10 text-green-400",
                  )}
                >
                  {time}
                  {status === "blocked" && <Lock className="h-3 w-3 absolute top-1 right-1 opacity-60" />}
                  {status === "booked" && <span className="absolute top-0.5 right-1.5 text-[8px]">band</span>}
                </button>
              );
            })}
          </div>
        )}

        {isEditing && (
          <Button className="w-full h-11" onClick={handleSaveSchedule}>
            <Save className="h-4 w-4 mr-2" />
            {t("barberPanel.saveSchedule")}
          </Button>
        )}
      </div>

      {/* Today's bookings */}
      {todayBookings.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <h3 className="font-semibold">{t("barberPanel.todayBookings")} ({todayBookings.length})</h3>
          {todayBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{booking.time}</Badge>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(booking.userAvatar)} />
                      <AvatarFallback className="text-xs">
                        {((booking.isManual ? booking.guestName : booking.userName) || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {booking.isManual ? booking.guestName : booking.userName || t("barberApp.client")}
                      </p>
                      {booking.isManual && booking.guestPhone && (
                        <p className="text-[11px] text-muted-foreground">{booking.guestPhone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={booking.status === "confirmed" ? "success" : booking.status === "completed" ? "success" : "default"}>
                      {booking.isManual ? t("barberApp.manual") : t(`status.${booking.status}`)}
                    </Badge>
                    {booking.status !== "completed" && (
                      <button
                        onClick={() => setCancelId(booking.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {booking.services.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {booking.services.map((s) => s.icon + " " + (lang === "uz" ? s.nameUz : lang === "ru" ? s.nameRu : s.name)).join(", ")}
                  </p>
                )}
                {booking.notes && (
                  <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                    "{booking.notes}"
                  </p>
                )}
                {booking.totalPrice > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{booking.totalDuration} {t("barberPanel.minutes")}</span>
                    <span className="font-semibold text-primary">{booking.totalPrice.toLocaleString()} {t("common.currency")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-between text-sm font-medium px-1">
            <span>{t("admin.totalRevenue")}:</span>
            <span className="text-primary">
              {todayBookings.reduce((s, b) => s + b.totalPrice, 0).toLocaleString()} {t("common.currency")}
            </span>
          </div>
        </div>
      )}

      <ManualBookingDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        barberId={barber.id}
        barberName={barber.name}
        selectedDate={selectedDate}
        selectedTime={manualTime}
        services={barber.services}
        onSuccess={handleManualSuccess}
      />

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>{t("profile.cancelBooking")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("profile.cancelConfirm")}</p>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelId(null)}>
              {t("common.close")}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleCancelBooking}>
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slot action dialog */}
      <Dialog open={!!slotAction} onOpenChange={(open) => !open && setSlotAction(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {slotAction?.time}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {slotAction?.status === "available" && (
              <>
                <Button
                  className="w-full h-12 justify-start gap-3 text-sm"
                  onClick={() => {
                    setSlotAction(null);
                    setManualTime(slotAction.time);
                    setManualOpen(true);
                  }}
                >
                  <Plus className="h-5 w-5" />
                  {t("barberApp.manualBooking")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-3 text-sm"
                  onClick={() => {
                    setSlotAction(null);
                    handleToggleBlock(slotAction.time);
                  }}
                >
                  <Lock className="h-5 w-5" />
                  {t("barberPanel.blockSlot")}
                </Button>
              </>
            )}
            {slotAction?.status === "blocked" && (
              <Button
                variant="outline"
                className="w-full h-12 justify-start gap-3 text-sm"
                onClick={() => {
                  setSlotAction(null);
                  handleToggleBlock(slotAction.time);
                }}
              >
                <Unlock className="h-5 w-5" />
                {t("barberPanel.unblockSlot")}
              </Button>
            )}
            {slotAction?.status === "booked" && (
              <p className="text-sm text-muted-foreground py-2">
                {t("barberPanel.slotBooked")}
              </p>
            )}
            {slotAction?.status !== "booked" && (
              <Button
                variant="destructive"
                className="w-full h-12 justify-start gap-3 text-sm"
                onClick={() => {
                  if (slotAction) handleRemoveSlot(slotAction.time);
                  setSlotAction(null);
                }}
              >
                <Trash2 className="h-5 w-5" />
                {t("barberPanel.removeSlot")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
