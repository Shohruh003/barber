import { format, addDays, isBefore, isToday, startOfDay } from "date-fns";
import { uz } from "date-fns/locale/uz";
import { ru } from "date-fns/locale/ru";
import { enUS } from "date-fns/locale/en-US";
import type { TimeSlot, WorkingHours } from "@/types";

const locales = { en: enUS, uz, ru };

export function formatDate(
  date: Date | string,
  formatStr: string = "dd MMMM yyyy",
  locale: "en" | "uz" | "ru" = "uz",
) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, formatStr, { locale: locales[locale] });
}

export function getDayName(
  date: Date,
): keyof WorkingHours {
  const days: (keyof WorkingHours)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
}

export function generateTimeSlots(
  open: string,
  close: string,
  duration: number = 30,
  bookedSlots: string[] = [],
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);

  let currentMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;

  while (currentMinutes + duration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

    slots.push({
      time: timeStr,
      available: !bookedSlots.includes(timeStr),
    });

    currentMinutes += duration;
  }

  return slots;
}

export function getNextNDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < n; i++) {
    days.push(addDays(startOfDay(new Date()), i));
  }
  return days;
}

export function isPastDate(date: Date): boolean {
  return isBefore(date, startOfDay(new Date())) && !isToday(date);
}
