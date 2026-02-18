import type { Barber, Booking, User, BarberDaySchedule, BlockedSlot } from "@/types";
import {
  mockBarbers,
  mockBookings,
  mockUser,
  mockAdmin,
  mockBarberUser,
  mockBookedSlots,
  mockReviews,
  mockBarberDaySchedules,
  mockBlockedSlots,
} from "./mockData";

// Simulate API delay
const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ---------- AUTH ----------
export async function loginAPI(
  email: string,
  _password: string,
): Promise<{ user: User; token: string }> {
  await delay(800);
  if (email === "admin@barberbook.uz") {
    return { user: mockAdmin, token: "mock-admin-token" };
  }
  if (email === "aziz@barberbook.uz") {
    return { user: mockBarberUser, token: "mock-barber-token" };
  }
  return { user: mockUser, token: "mock-token-123" };
}

export async function registerAPI(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ user: User; token: string }> {
  await delay(800);
  const newUser: User = {
    id: "u-new-" + Date.now(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "user",
    createdAt: new Date().toISOString(),
  };
  return { user: newUser, token: "mock-token-new" };
}

// ---------- BARBERS ----------
export async function fetchBarbers(): Promise<Barber[]> {
  await delay(600);
  return mockBarbers;
}

export async function fetchBarberById(id: string): Promise<Barber | null> {
  await delay(400);
  return mockBarbers.find((b) => b.id === id) || null;
}

export async function searchBarbers(query: string): Promise<Barber[]> {
  await delay(400);
  const q = query.toLowerCase();
  return mockBarbers.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q) ||
      b.locationUz.toLowerCase().includes(q) ||
      b.services.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nameUz.toLowerCase().includes(q),
      ),
  );
}

// ---------- BOOKINGS ----------
export async function fetchUserBookings(
  _userId: string,
): Promise<Booking[]> {
  await delay(500);
  return [...mockBookings];
}

export async function fetchAllBookings(): Promise<Booking[]> {
  await delay(500);
  return [...mockBookings];
}

export async function createBooking(
  data: Omit<Booking, "id" | "createdAt">,
): Promise<Booking> {
  await delay(700);
  const newBooking: Booking = {
    ...data,
    id: "bk-" + Date.now(),
    createdAt: new Date().toISOString(),
  };
  mockBookings.push(newBooking);
  return newBooking;
}

export async function cancelBooking(bookingId: string): Promise<boolean> {
  await delay(500);
  const booking = mockBookings.find((b) => b.id === bookingId);
  if (booking) {
    booking.status = "cancelled";
    return true;
  }
  return false;
}

export async function confirmBookingAPI(bookingId: string): Promise<boolean> {
  await delay(500);
  const booking = mockBookings.find((b) => b.id === bookingId);
  if (booking) {
    booking.status = "confirmed";
    return true;
  }
  return false;
}

export async function completeBookingAPI(bookingId: string): Promise<boolean> {
  await delay(500);
  const booking = mockBookings.find((b) => b.id === bookingId);
  if (booking) {
    booking.status = "completed";
    return true;
  }
  return false;
}

export async function toggleBarberAvailability(
  barberId: string,
): Promise<Barber | null> {
  await delay(400);
  const barber = mockBarbers.find((b) => b.id === barberId);
  if (barber) {
    barber.isAvailable = !barber.isAvailable;
    return { ...barber };
  }
  return null;
}

export async function fetchBookedSlots(
  barberId: string,
  date: string,
): Promise<string[]> {
  await delay(300);
  const key = `${barberId}-${date}`;
  const booked = mockBookedSlots[key] || [];
  // Also include blocked slots as unavailable
  const blocked = mockBlockedSlots
    .filter((s) => s.barberId === barberId && s.date === date)
    .map((s) => s.time);
  return [...new Set([...booked, ...blocked])];
}

// ---------- REVIEWS ----------
export async function fetchBarberReviews(barberId: string) {
  await delay(400);
  return mockReviews.filter((r) => r.barberId === barberId);
}

// ---------- PROFILE ----------
export async function updateProfile(
  _userId: string,
  data: Partial<User>,
): Promise<User> {
  await delay(500);
  return { ...mockUser, ...data };
}

// ---------- BARBER SCHEDULE ----------
export async function fetchBarberDaySchedule(
  barberId: string,
  date: string,
): Promise<BarberDaySchedule | null> {
  await delay(300);
  const key = `${barberId}-${date}`;
  return mockBarberDaySchedules[key] || null;
}

export async function saveBarberDaySchedule(
  schedule: BarberDaySchedule,
): Promise<BarberDaySchedule> {
  await delay(500);
  const key = `${schedule.barberId}-${schedule.date}`;
  mockBarberDaySchedules[key] = schedule;
  return schedule;
}

export async function fetchBlockedSlots(
  barberId: string,
  date: string,
): Promise<BlockedSlot[]> {
  await delay(300);
  return mockBlockedSlots.filter(
    (s) => s.barberId === barberId && s.date === date,
  );
}

export async function toggleBlockSlot(
  barberId: string,
  date: string,
  time: string,
): Promise<boolean> {
  await delay(300);
  const idx = mockBlockedSlots.findIndex(
    (s) => s.barberId === barberId && s.date === date && s.time === time,
  );
  if (idx >= 0) {
    mockBlockedSlots.splice(idx, 1);
    return false; // unblocked
  }
  mockBlockedSlots.push({ barberId, date, time });
  return true; // blocked
}

export async function updateBarberSlotDuration(
  barberId: string,
  duration: number,
): Promise<Barber | null> {
  await delay(300);
  const barber = mockBarbers.find((b) => b.id === barberId);
  if (barber) {
    barber.slotDuration = duration;
    return barber;
  }
  return null;
}
