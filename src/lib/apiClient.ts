import type { Barber, Booking, User, BarberDaySchedule, BlockedSlot, BarberNotification, Review } from "@/types";
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
  defaultWorkingHours,
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
  role: "user" | "barber";
}): Promise<{ user: User; token: string }> {
  await delay(800);
  const id = (data.role === "barber" ? "b-new-" : "u-new-") + Date.now();
  const newUser: User = {
    id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    createdAt: new Date().toISOString(),
  };

  if (data.role === "barber") {
    const newBarber: Barber = {
      id,
      name: data.name,
      avatar: "",
      bio: "", bioUz: "", bioRu: "",
      phone: data.phone,
      rating: 0,
      reviewCount: 0,
      experience: 0,
      location: "", locationUz: "", locationRu: "",
      services: [],
      workingHours: { ...defaultWorkingHours },
      gallery: [],
      isAvailable: false,
      slotDuration: 30,
      socialLinks: {},
    };
    mockBarbers.push(newBarber);
  }

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
  userId: string,
): Promise<Booking[]> {
  await delay(500);
  return mockBookings.filter((b) => b.userId === userId);
}

export async function fetchBarberBookings(
  barberId: string,
): Promise<Booking[]> {
  await delay(500);
  return mockBookings.filter((b) => b.barberId === barberId);
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
  // Include times from actual bookings (confirmed/pending)
  const bookedFromBookings = mockBookings
    .filter(
      (b) =>
        b.barberId === barberId &&
        b.date === date &&
        (b.status === "confirmed" || b.status === "pending"),
    )
    .map((b) => b.time);
  // Also include blocked slots as unavailable
  const blocked = mockBlockedSlots
    .filter((s) => s.barberId === barberId && s.date === date)
    .map((s) => s.time);
  return [...new Set([...booked, ...bookedFromBookings, ...blocked])];
}

// ---------- REVIEWS ----------
export async function fetchBarberReviews(barberId: string) {
  await delay(400);
  return mockReviews.filter((r) => r.barberId === barberId);
}

export async function createReview(
  data: Omit<Review, "id" | "createdAt">,
): Promise<Review> {
  await delay(500);
  const review: Review = {
    ...data,
    id: "rev-" + Date.now(),
    createdAt: new Date().toISOString().split("T")[0],
  };
  mockReviews.push(review);
  // Update barber rating
  const barber = mockBarbers.find((b) => b.id === data.barberId);
  if (barber) {
    const allReviews = mockReviews.filter((r) => r.barberId === data.barberId);
    barber.rating = Math.round(
      (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10,
    ) / 10;
    barber.reviewCount = allReviews.length;
  }
  return review;
}

// ---------- PROFILE ----------
export async function updateProfile(
  userId: string,
  data: Partial<User>,
): Promise<User> {
  await delay(500);
  // Also update barber name/phone/avatar if user is barber
  const barber = mockBarbers.find((b) => b.id === userId);
  if (barber) {
    if (data.name) barber.name = data.name;
    if (data.phone) barber.phone = data.phone;
    if (data.avatar) barber.avatar = data.avatar;
  }
  return { ...mockUser, ...data };
}

export async function updateBarberProfile(
  barberId: string,
  data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>,
): Promise<Barber | null> {
  await delay(500);
  const barber = mockBarbers.find((b) => b.id === barberId);
  if (barber) {
    Object.assign(barber, data);
    return { ...barber };
  }
  return null;
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

export async function fetchBarberScheduledDates(
  barberId: string,
  dates: string[],
): Promise<string[]> {
  await delay(300);
  return dates.filter((date) => {
    const key = `${barberId}-${date}`;
    const schedule = mockBarberDaySchedules[key];
    return schedule && schedule.slots.length > 0;
  });
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

// ---------- NOTIFICATIONS ----------
const mockNotifications: BarberNotification[] = [];

export async function fetchBarberNotifications(
  barberId: string,
): Promise<BarberNotification[]> {
  await delay(300);
  return mockNotifications
    .filter((n) => n.barberId === barberId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createNotification(
  notification: Omit<BarberNotification, "id" | "createdAt" | "isRead">,
): Promise<BarberNotification> {
  await delay(100);
  const newNotification: BarberNotification = {
    ...notification,
    id: "notif-" + Date.now(),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  mockNotifications.push(newNotification);
  return newNotification;
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await delay(200);
  const notif = mockNotifications.find((n) => n.id === notificationId);
  if (notif) notif.isRead = true;
}

export async function markAllNotificationsRead(
  barberId: string,
): Promise<void> {
  await delay(200);
  mockNotifications
    .filter((n) => n.barberId === barberId)
    .forEach((n) => (n.isRead = true));
}
