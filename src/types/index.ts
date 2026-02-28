export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: "user" | "admin" | "barber";
  password?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  nameUz: string;
  nameRu: string;
  description: string;
  descriptionUz: string;
  descriptionRu: string;
  price: number;
  duration: number; // minutes
  icon: string;
}

export interface Barber {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  bioUz: string;
  bioRu: string;
  phone: string;
  rating: number;
  reviewCount: number;
  experience: string | number; // years, e.g. 5, "8+", "10+"
  location: string;
  locationUz: string;
  locationRu: string;
  services: Service[];
  workingHours: WorkingHours;
  gallery: string[];
  isAvailable: boolean;
  slotDuration: number; // minutes (default 30)
  latitude?: number;
  longitude?: number;
  geoAddress?: string;
  reminderDays?: number;
  socialLinks?: {
    instagram?: string;
    telegram?: string;
    facebook?: string;
  };
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  open: string; // "09:00"
  close: string; // "18:00"
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
}

export interface Booking {
  id: string;
  userId?: string;
  barberId: string;
  barberName: string;
  barberAvatar: string;
  userName: string;
  userAvatar: string;
  guestName?: string;
  guestPhone?: string;
  isManual?: boolean;
  services: Service[];
  date: string; // "2025-01-15"
  time: string; // "14:00"
  status: "confirmed" | "completed" | "cancelled";
  totalPrice: number;
  totalDuration: number; // minutes
  createdAt: string;
  notes?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  barberId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Barber's custom schedule for a specific date
export interface BarberDaySchedule {
  barberId: string;
  date: string; // "2026-02-20"
  slots: string[]; // ["09:00", "10:00", "11:00", "13:00", "14:00"]
}

// Slots manually blocked by barber (e.g. phone bookings)
export interface BlockedSlot {
  barberId: string;
  date: string;
  time: string;
}

export interface BarberNotification {
  id: string;
  barberId: string;
  type: "new_booking" | "booking_cancelled" | "manual_booking" | "reminder";
  title: string;
  message: string;
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface BarberClient {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastVisit: string;
  totalVisits: number;
  isRegistered: boolean;
}

export type Language = "en" | "uz" | "ru";
export type Theme = "light" | "dark";
