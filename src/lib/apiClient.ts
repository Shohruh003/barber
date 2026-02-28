/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Barber, Booking, User, BarberDaySchedule, BlockedSlot, BarberNotification, BarberClient, Review, Service } from "@/types";

const API_URL = "http://localhost:5000";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("barber-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
}

async function api<T>(path: string, options: RequestInit = {}, skipAuth = false): Promise<T> {
  const token = skipAuth ? null : getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API Error ${res.status}`);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as unknown as T);
}

// Transform backend barber → frontend Barber
function transformBarber(raw: Record<string, any>): Barber {
  return {
    id: raw.id,
    name: raw.user?.name || "",
    avatar: getAvatarUrl(raw.user?.avatar) || "",
    phone: raw.user?.phone || "",
    bio: raw.bio,
    bioUz: raw.bioUz,
    bioRu: raw.bioRu,
    rating: raw.rating,
    reviewCount: raw.reviewCount,
    experience: raw.experience,
    location: raw.location,
    locationUz: raw.locationUz,
    locationRu: raw.locationRu,
    services: raw.services || [],
    workingHours: raw.workingHours,
    gallery: (raw.gallery || []).map((img: string) => getAvatarUrl(img)),
    isAvailable: raw.isAvailable,
    slotDuration: raw.slotDuration,
    latitude: raw.latitude ?? undefined,
    longitude: raw.longitude ?? undefined,
    geoAddress: raw.geoAddress ?? undefined,
    reminderDays: raw.reminderDays ?? 14,
    socialLinks: {
      instagram: raw.instagram || undefined,
      telegram: raw.telegram || undefined,
      facebook: raw.facebook || undefined,
    },
  };
}

// Transform backend BookingService → frontend Service
function transformBookingServices(services: Record<string, any>[]): Service[] {
  return (services || []).map((s) => ({
    id: s.serviceId || s.id,
    name: s.name,
    nameUz: s.nameUz,
    nameRu: s.nameRu,
    description: "",
    descriptionUz: "",
    descriptionRu: "",
    price: s.price,
    duration: s.duration,
    icon: s.icon,
  }));
}

function transformBooking(raw: Record<string, any>): Booking {
  return {
    ...raw,
    userAvatar: getAvatarUrl(raw.userAvatar),
    services: transformBookingServices(raw.services),
    createdAt: raw.createdAt,
  } as Booking;
}

// ---------- AUTH ----------
export async function loginAPI(
  email: string,
  password: string,
): Promise<{ user: User; token: string }> {
  const result = await api<{ user: User; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, true);
  if (result.user?.avatar) result.user.avatar = getAvatarUrl(result.user.avatar);
  return result;
}

export async function registerAPI(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user" | "barber";
}): Promise<{ user: User; token: string }> {
  const result = await api<{ user: User; token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  }, true);
  if (result.user?.avatar) result.user.avatar = getAvatarUrl(result.user.avatar);
  return result;
}

// ---------- BARBERS ----------
export async function fetchBarbers(): Promise<Barber[]> {
  const raw = await api<Record<string, any>[]>("/barbers");
  return raw.map(transformBarber);
}

export async function fetchBarberById(id: string): Promise<Barber | null> {
  try {
    const raw = await api<Record<string, any>>(`/barbers/${id}`);
    return transformBarber(raw);
  } catch {
    return null;
  }
}

export async function searchBarbers(query: string): Promise<Barber[]> {
  const raw = await api<Record<string, any>[]>(`/barbers/search?q=${encodeURIComponent(query)}`);
  return raw.map(transformBarber);
}

// ---------- BOOKINGS ----------
export async function fetchUserBookings(userId: string): Promise<Booking[]> {
  const raw = await api<Record<string, any>[]>(`/bookings/user/${userId}`);
  return raw.map(transformBooking);
}

export async function fetchBarberBookings(barberId: string): Promise<Booking[]> {
  const raw = await api<Record<string, any>[]>(`/bookings/barber/${barberId}`);
  return raw.map(transformBooking);
}

export async function fetchAllBookings(): Promise<Booking[]> {
  const raw = await api<Record<string, any>[]>("/bookings");
  return raw.map(transformBooking);
}

export async function createBooking(
  data: Omit<Booking, "id" | "createdAt">,
): Promise<Booking> {
  const raw = await api<Record<string, any>>("/bookings", {
    method: "POST",
    body: JSON.stringify({
      userId: data.userId,
      barberId: data.barberId,
      date: data.date,
      time: data.time,
      totalPrice: data.totalPrice,
      totalDuration: data.totalDuration,
      notes: data.notes,
      services: data.services.map((s) => ({
        id: s.id,
        name: s.name,
        nameUz: s.nameUz,
        nameRu: s.nameRu,
        price: s.price,
        duration: s.duration,
        icon: s.icon,
      })),
    }),
  });
  return transformBooking(raw);
}

export async function createManualBooking(data: {
  barberId: string;
  date: string;
  time: string;
  guestName: string;
  guestPhone: string;
  services?: { id: string; name: string; nameUz: string; nameRu: string; price: number; duration: number; icon: string }[];
  totalPrice?: number;
  totalDuration?: number;
  notes?: string;
}): Promise<Booking> {
  const raw = await api<Record<string, any>>("/bookings/manual", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return transformBooking(raw);
}

export async function fetchBarberClients(barberId: string): Promise<BarberClient[]> {
  return api(`/bookings/barber/${barberId}/clients`);
}

export async function cancelBooking(bookingId: string): Promise<boolean> {
  await api(`/bookings/${bookingId}/cancel`, { method: "PATCH" });
  return true;
}

export async function confirmBookingAPI(bookingId: string): Promise<boolean> {
  await api(`/bookings/${bookingId}/confirm`, { method: "PATCH" });
  return true;
}

export async function completeBookingAPI(bookingId: string): Promise<boolean> {
  await api(`/bookings/${bookingId}/complete`, { method: "PATCH" });
  return true;
}

export async function toggleBarberAvailability(
  barberId: string,
): Promise<Barber | null> {
  const raw = await api<Record<string, any>>(`/barbers/${barberId}/toggle-availability`, { method: "PATCH" });
  return { ...raw, name: "", avatar: "", phone: "", socialLinks: {} } as Barber;
}

export async function fetchBookedSlots(
  barberId: string,
  date: string,
): Promise<string[]> {
  return api(`/bookings/booked-slots?barberId=${barberId}&date=${date}`);
}

// ---------- REVIEWS ----------
export async function fetchBarberReviews(barberId: string): Promise<Review[]> {
  return api(`/reviews/barber/${barberId}`);
}

export async function createReview(
  data: Omit<Review, "id" | "createdAt">,
): Promise<Review> {
  return api("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------- AVATAR URL ----------
export function getAvatarUrl(avatar?: string | null): string {
  if (!avatar) return "";
  if (avatar.startsWith("http") || avatar.startsWith("blob:")) return avatar;
  return `${API_URL}${avatar}`;
}

// ---------- PROFILE ----------
export async function updateProfile(
  userId: string,
  data: Partial<User> & { oldPassword?: string; newPassword?: string },
): Promise<User> {
  const user = await api<User>(`/users/${userId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (user?.avatar) user.avatar = getAvatarUrl(user.avatar);
  return user;
}

export async function uploadAvatar(userId: string, file: File): Promise<User> {
  const token = getToken();
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_URL}/users/${userId}/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload Error ${res.status}`);
  }
  const user = await res.json();
  if (user?.avatar) user.avatar = getAvatarUrl(user.avatar);
  return user;
}

export async function updateBarberProfile(
  barberId: string,
  data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>,
): Promise<Barber | null> {
  // Strip API_URL prefix from gallery URLs before sending to backend
  const payload = { ...data };
  if (payload.gallery) {
    payload.gallery = payload.gallery.map((url) =>
      url.startsWith(API_URL) ? url.replace(API_URL, "") : url,
    );
  }
  return api(`/barbers/${barberId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadGalleryImages(
  barberId: string,
  files: File[],
): Promise<Barber | null> {
  const token = getToken();
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const res = await fetch(`${API_URL}/barbers/${barberId}/gallery`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload Error ${res.status}`);
  }
  const raw = await res.json();
  return transformBarber(raw);
}

// ---------- BARBER SCHEDULE ----------
export async function fetchBarberDaySchedule(
  barberId: string,
  date: string,
): Promise<BarberDaySchedule | null> {
  try {
    return await api<BarberDaySchedule>(`/schedule/${barberId}/${date}`);
  } catch {
    return null;
  }
}

export async function fetchBarberScheduledDates(
  barberId: string,
  dates: string[],
): Promise<string[]> {
  const params = dates.map((d) => `dates=${d}`).join("&");
  return api(`/schedule/${barberId}/scheduled-dates?${params}`);
}

export async function saveBarberDaySchedule(
  schedule: BarberDaySchedule,
): Promise<BarberDaySchedule> {
  return api("/schedule", {
    method: "PUT",
    body: JSON.stringify({
      barberId: schedule.barberId,
      date: schedule.date,
      slots: schedule.slots,
    }),
  });
}

export async function fetchBlockedSlots(
  barberId: string,
  date: string,
): Promise<BlockedSlot[]> {
  return api(`/schedule/${barberId}/${date}/blocked`);
}

export async function toggleBlockSlot(
  barberId: string,
  date: string,
  time: string,
): Promise<boolean> {
  return api("/schedule/block-slot", {
    method: "POST",
    body: JSON.stringify({ barberId, date, time }),
  });
}

export async function updateBarberSlotDuration(
  barberId: string,
  duration: number,
): Promise<Barber | null> {
  return api(`/barbers/${barberId}/slot-duration`, {
    method: "PATCH",
    body: JSON.stringify({ duration }),
  });
}

// ---------- NOTIFICATIONS ----------
export async function fetchBarberNotifications(
  barberId: string,
): Promise<BarberNotification[]> {
  return api(`/notifications/barber/${barberId}`);
}

export async function createNotification(
  notification: Omit<BarberNotification, "id" | "createdAt" | "isRead">,
): Promise<BarberNotification> {
  return api("/notifications", {
    method: "POST",
    body: JSON.stringify(notification),
  });
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await api(`/notifications/${notificationId}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(
  barberId: string,
): Promise<void> {
  await api(`/notifications/barber/${barberId}/read-all`, { method: "PATCH" });
}

// ---------- USER MANAGEMENT ----------
export async function fetchUsersAPI(): Promise<User[]> {
  return api("/users?role=user");
}

export async function fetchBarberUsersAPI(): Promise<User[]> {
  return api("/users?role=barber");
}

export async function updateUserAPI(
  id: string,
  data: Partial<User>,
): Promise<User | null> {
  return api(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUserAPI(id: string): Promise<boolean> {
  await api(`/users/${id}`, { method: "DELETE" });
  return true;
}
