import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, addDays, startOfDay } from "date-fns";
import {
  Calendar,
  Clock,
  Plus,
  Save,
  Settings2,
  Lock,
  Unlock,
  CalendarDays,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBarberScheduleStore } from "@/store/barberScheduleStore";
import { useBookingStore } from "@/store/bookingStore";
import { generateTimeSlots, getDayName } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BarberPanel() {
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

  const { bookings, loadAllBookings, toggleBarberStatus } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [editSlots, setEditSlots] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Slot generator form
  const [genFrom, setGenFrom] = useState("09:00");
  const [genTo, setGenTo] = useState("19:00");
  const [lunchFrom, setLunchFrom] = useState("13:00");
  const [lunchTo, setLunchTo] = useState("14:00");
  const [skipLunch, setSkipLunch] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState("");

  // Slot duration editing
  const [durationEdit, setDurationEdit] = useState(false);
  const [tempDuration, setTempDuration] = useState(30);

  useEffect(() => {
    if (user) {
      loadBarber(user.id);
      loadAllBookings();
    }
  }, [user, loadBarber, loadAllBookings]);

  useEffect(() => {
    if (barber) {
      setTempDuration(barber.slotDuration);
    }
  }, [barber]);

  useEffect(() => {
    if (user && selectedDate) {
      loadDaySchedule(user.id, selectedDate);
    }
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
    () =>
      bookings.filter(
        (b) =>
          b.barberId === user?.id &&
          b.date === selectedDate &&
          b.status !== "cancelled",
      ),
    [bookings, user, selectedDate],
  );

  const bookedTimes = useMemo(
    () => todayBookings.map((b) => b.time),
    [todayBookings],
  );

  const blockedTimes = useMemo(
    () => blockedSlots.map((s) => s.time),
    [blockedSlots],
  );

  if (barberLoading || !barber) return <PageLoader />;

  const handleGenerateSlots = () => {
    const duration = barber.slotDuration;
    const allSlots = generateTimeSlots(genFrom, genTo, duration, []);
    let slots = allSlots.map((s) => s.time);

    if (!skipLunch && lunchFrom && lunchTo) {
      const [lStartH, lStartM] = lunchFrom.split(":").map(Number);
      const [lEndH, lEndM] = lunchTo.split(":").map(Number);
      const lunchStart = lStartH * 60 + lStartM;
      const lunchEnd = lEndH * 60 + lEndM;

      slots = slots.filter((time) => {
        const [h, m] = time.split(":").map(Number);
        const mins = h * 60 + m;
        return mins < lunchStart || mins >= lunchEnd;
      });
    }

    setEditSlots(slots);
    setIsEditing(true);
  };

  const handleAddSlot = () => {
    if (!newSlotTime) return;
    if (editSlots.includes(newSlotTime)) {
      toast.error("Slot already exists");
      return;
    }
    const updated = [...editSlots, newSlotTime].sort();
    setEditSlots(updated);
    setNewSlotTime("");
    setIsEditing(true);
  };

  const handleRemoveSlot = async (time: string) => {
    const updated = editSlots.filter((s) => s !== time);
    setEditSlots(updated);
    // Auto-save immediately
    await saveDaySchedule({
      barberId: barber.id,
      date: selectedDate,
      slots: updated,
    });
    setIsEditing(false);
    toast.success(t("barberPanel.slotRemoved"));
  };

  const handleSaveSchedule = async () => {
    await saveDaySchedule({
      barberId: barber.id,
      date: selectedDate,
      slots: editSlots,
    });
    setIsEditing(false);
    toast.success(t("barberPanel.scheduleSaved"));
  };

  const handleToggleBlock = async (time: string) => {
    await toggleBlock(barber.id, selectedDate, time);
    const wasBlocked = blockedTimes.includes(time);
    toast.success(
      wasBlocked
        ? t("barberPanel.slotUnblocked")
        : t("barberPanel.slotBlocked"),
    );
  };

  const handleSaveDuration = async () => {
    await updateSlotDuration(barber.id, tempDuration);
    setDurationEdit(false);
    toast.success(t("common.success"));
  };

  const getSlotStatus = (time: string) => {
    if (bookedTimes.includes(time)) return "booked";
    if (blockedTimes.includes(time)) return "blocked";
    return "available";
  };

  const handleToggleAvailability = async () => {
    await toggleBarberStatus(barber.id);
    await loadBarber(barber.id);
    toast.success(t("admin.barberStatusChanged"));
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={barber.avatar} />
            <AvatarFallback>{barber.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{t("barberPanel.title")}</h1>
            <p className="text-sm text-muted-foreground">{barber.name}</p>
          </div>
        </div>
        <Button
          variant={barber.isAvailable ? "default" : "outline"}
          onClick={handleToggleAvailability}
          className="gap-2"
        >
          {barber.isAvailable ? (
            <ToggleRight className="h-5 w-5" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
          <Badge variant={barber.isAvailable ? "success" : "secondary"}>
            {barber.isAvailable
              ? t("barbers.available")
              : t("barbers.unavailable")}
          </Badge>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Schedule Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                {t("barberPanel.selectDate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {dates.map((date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={cn(
                        "flex flex-col items-center min-w-[72px] rounded-lg border p-3 transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <span className="text-xs font-medium">
                        {format(date, "EEE")}
                      </span>
                      <span className="text-lg font-bold">
                        {format(date, "dd")}
                      </span>
                      <span className="text-xs">{format(date, "MMM")}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Slot Duration Setting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  {t("barberPanel.slotDuration")}
                </span>
                {!durationEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDurationEdit(true)}
                  >
                    {barber.slotDuration} {t("barberPanel.minutes")}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            {durationEdit && (
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {[15, 20, 30, 45, 60, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => setTempDuration(d)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                          tempDuration === d
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" onClick={handleSaveDuration}>
                    <Save className="h-4 w-4 mr-1" />
                    {t("common.save")}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Generate Slots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                {t("barberPanel.generateSlots")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("barberPanel.from")}</Label>
                  <Input
                    type="time"
                    value={genFrom}
                    onChange={(e) => setGenFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("barberPanel.to")}</Label>
                  <Input
                    type="time"
                    value={genTo}
                    onChange={(e) => setGenTo(e.target.value)}
                  />
                </div>
                {!skipLunch && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        {t("barberPanel.lunchStart")}
                      </Label>
                      <Input
                        type="time"
                        value={lunchFrom}
                        onChange={(e) => setLunchFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        {t("barberPanel.lunchEnd")}
                      </Label>
                      <Input
                        type="time"
                        value={lunchTo}
                        onChange={(e) => setLunchTo(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipLunch}
                    onChange={(e) => setSkipLunch(e.target.checked)}
                    className="rounded"
                  />
                  {t("barberPanel.skipLunch")}
                </label>

                <Button onClick={handleGenerateSlots}>
                  {t("barberPanel.generateSlots")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Slots Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>
                  {t("barberPanel.customSlots")} — {selectedDate}
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="w-32"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddSlot}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t("barberPanel.addSlot")}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <PageLoader />
              ) : editSlots.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("barberPanel.noSchedule")}
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Legend */}
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-green-500" />
                      {t("barberPanel.available")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-blue-500" />
                      {t("barberPanel.booked")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-red-500" />
                      {t("barberPanel.blocked")}
                    </span>
                  </div>

                  {/* Slots */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {editSlots.map((time) => {
                      const status = getSlotStatus(time);
                      return (
                        <div
                          key={time}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 transition-all",
                            status === "booked" &&
                              "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20",
                            status === "blocked" &&
                              "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20",
                            status === "available" &&
                              "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20",
                          )}
                        >
                          <span className="font-medium text-sm">{time}</span>
                          <div className="flex items-center gap-1">
                            {status === "booked" ? (
                              <Badge variant="default" className="text-xs">
                                {t("barberPanel.booked")}
                              </Badge>
                            ) : status === "blocked" ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                                  onClick={() => handleToggleBlock(time)}
                                >
                                  <Unlock className="h-3.5 w-3.5 mr-1" />
                                  {t("barberPanel.unblockSlot")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-1 text-xs text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveSlot(time)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleToggleBlock(time)}
                                >
                                  <Lock className="h-3.5 w-3.5 mr-1" />
                                  {t("barberPanel.blockSlot")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-1 text-xs text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveSlot(time)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isEditing && (
                    <div className="flex justify-end pt-2">
                      <Button onClick={handleSaveSchedule}>
                        <Save className="h-4 w-4 mr-2" />
                        {t("barberPanel.saveSchedule")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Today's Bookings */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5" />
                {t("barberPanel.todayBookings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  {t("barberPanel.noBookingsToday")}
                </p>
              ) : (
                todayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {booking.time}
                      </span>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "success"
                            : booking.status === "pending"
                              ? "warning"
                              : "default"
                        }
                      >
                        {t(`status.${booking.status}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
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
                    {booking.notes && (
                      <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                        "{booking.notes}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{booking.totalDuration} {t("barberPanel.minutes")}</span>
                      <span className="font-semibold text-primary">
                        {booking.totalPrice.toLocaleString()} {t("common.currency")}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {todayBookings.length > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm font-medium">
                    <span>{t("admin.totalRevenue")}:</span>
                    <span className="text-primary">
                      {todayBookings
                        .reduce((sum, b) => sum + b.totalPrice, 0)
                        .toLocaleString()}{" "}
                      {t("common.currency")}
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
