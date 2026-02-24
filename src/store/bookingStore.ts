import { create } from "zustand";
import type { Booking, Barber, Service } from "@/types";
import {
  fetchUserBookings,
  fetchBarberBookings,
  fetchAllBookings,
  createBooking,
  cancelBooking,
  completeBookingAPI,
  fetchBarbers,
  fetchBarberById,
  searchBarbers,
  fetchBookedSlots,
  fetchBarberDaySchedule,
  toggleBarberAvailability,
  createNotification,
  createReview,
} from "@/lib/apiClient";

interface BookingState {
  // Barbers
  barbers: Barber[];
  selectedBarber: Barber | null;
  barbersLoading: boolean;

  // Booking flow - multi-service
  selectedServices: Service[];
  selectedDate: string | null;
  selectedTime: string | null;
  bookedSlots: string[];
  customDaySlots: string[] | null; // barber's custom slots for selected date

  // Bookings list
  bookings: Booking[];
  bookingsLoading: boolean;

  // Actions - Barbers
  loadBarbers: () => Promise<void>;
  loadBarberById: (id: string) => Promise<void>;
  searchBarbersList: (query: string) => Promise<void>;

  // Actions - Booking flow
  toggleService: (service: Service) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedTime: (time: string | null) => void;
  loadBookedSlots: (barberId: string, date: string) => Promise<void>;
  confirmBooking: (
    userId: string,
    barber: Barber,
    services: Service[],
    date: string,
    time: string,
    notes?: string,
  ) => Promise<Booking>;
  resetBookingFlow: () => void;

  // Computed helpers
  getTotalPrice: () => number;
  getTotalDuration: () => number;

  // Actions - Bookings list
  loadUserBookings: (userId: string) => Promise<void>;
  loadBarberBookings: (barberId: string) => Promise<void>;
  loadAllBookings: () => Promise<void>;
  cancelUserBooking: (bookingId: string) => Promise<void>;

  // User complete + review
  completeBookingUser: (
    bookingId: string,
    review: { userId: string; userName: string; userAvatar?: string; barberId: string; rating: number; comment: string },
  ) => Promise<void>;

  // Admin actions
  completeBookingAdmin: (bookingId: string) => Promise<void>;
  toggleBarberStatus: (barberId: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>()((set, get) => ({
  barbers: [],
  selectedBarber: null,
  barbersLoading: false,

  selectedServices: [],
  selectedDate: null,
  selectedTime: null,
  bookedSlots: [],
  customDaySlots: null,

  bookings: [],
  bookingsLoading: false,

  loadBarbers: async () => {
    set({ barbersLoading: true });
    const barbers = await fetchBarbers();
    set({ barbers, barbersLoading: false });
  },

  loadBarberById: async (id) => {
    set({ barbersLoading: true });
    const barber = await fetchBarberById(id);
    set({ selectedBarber: barber, barbersLoading: false });
  },

  searchBarbersList: async (query) => {
    set({ barbersLoading: true });
    const barbers = await searchBarbers(query);
    set({ barbers, barbersLoading: false });
  },

  toggleService: (service) =>
    set((state) => {
      const exists = state.selectedServices.find((s) => s.id === service.id);
      if (exists) {
        return {
          selectedServices: state.selectedServices.filter(
            (s) => s.id !== service.id,
          ),
        };
      }
      return { selectedServices: [...state.selectedServices, service] };
    }),

  setSelectedDate: (date) =>
    set({ selectedDate: date, selectedTime: null, bookedSlots: [], customDaySlots: null }),
  setSelectedTime: (time) => set({ selectedTime: time }),

  loadBookedSlots: async (barberId, date) => {
    const [slots, daySchedule] = await Promise.all([
      fetchBookedSlots(barberId, date),
      fetchBarberDaySchedule(barberId, date),
    ]);
    set({
      bookedSlots: slots,
      customDaySlots: daySchedule ? daySchedule.slots : null,
    });
  },

  getTotalPrice: () => {
    return get().selectedServices.reduce((sum, s) => sum + s.price, 0);
  },

  getTotalDuration: () => {
    return get().selectedServices.reduce((sum, s) => sum + s.duration, 0);
  },

  confirmBooking: async (userId, barber, services, date, time, notes) => {
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const booking = await createBooking({
      userId,
      barberId: barber.id,
      barberName: barber.name,
      barberAvatar: barber.avatar,
      services,
      date,
      time,
      status: "confirmed",
      totalPrice,
      totalDuration,
      notes,
    });
    set((state) => ({ bookings: [booking, ...state.bookings] }));

    // Send notification to barber
    const serviceNames = services.map((s) => s.name).join(", ");
    const notesText = notes ? `\nSharh: "${notes}"` : "";
    await createNotification({
      barberId: barber.id,
      type: "new_booking",
      title: `Yangi buyurtma: ${date} ${time}`,
      message: `Mijoz ${serviceNames} xizmatiga ${date} kuni soat ${time} da yozildi. Narxi: ${totalPrice.toLocaleString()} so'm${notesText}`,
      bookingId: booking.id,
    });

    return booking;
  },

  resetBookingFlow: () =>
    set({
      selectedServices: [],
      selectedDate: null,
      selectedTime: null,
      bookedSlots: [],
      customDaySlots: null,
    }),

  loadUserBookings: async (userId) => {
    set({ bookingsLoading: true });
    const bookings = await fetchUserBookings(userId);
    set({ bookings, bookingsLoading: false });
  },

  loadBarberBookings: async (barberId) => {
    set({ bookingsLoading: true });
    const bookings = await fetchBarberBookings(barberId);
    set({ bookings, bookingsLoading: false });
  },

  loadAllBookings: async () => {
    set({ bookingsLoading: true });
    const bookings = await fetchAllBookings();
    set({ bookings, bookingsLoading: false });
  },

  cancelUserBooking: async (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    await cancelBooking(bookingId);
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "cancelled" as const } : b,
      ),
    }));
    if (booking) {
      const serviceNames = booking.services.map((s) => s.name).join(", ");
      await createNotification({
        barberId: booking.barberId,
        type: "booking_cancelled",
        title: `Buyurtma bekor qilindi: ${booking.date} ${booking.time}`,
        message: `Mijoz ${serviceNames} xizmatiga ${booking.date} kuni soat ${booking.time} dagi buyurtmani bekor qildi`,
        bookingId: booking.id,
      });
    }
  },

  completeBookingUser: async (bookingId, review) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    await completeBookingAPI(bookingId);
    if (review.rating > 0 && review.comment.trim()) {
      await createReview(review);
      if (booking) {
        const stars = "⭐".repeat(review.rating);
        await createNotification({
          barberId: review.barberId,
          type: "new_booking",
          title: `${review.userName} sizni baholadi ${stars}`,
          message: `"${review.comment}"`,
          bookingId,
        });
      }
    }
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "completed" as const } : b,
      ),
    }));
  },

  completeBookingAdmin: async (bookingId) => {
    await completeBookingAPI(bookingId);
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "completed" as const } : b,
      ),
    }));
  },

  toggleBarberStatus: async (barberId) => {
    const updated = await toggleBarberAvailability(barberId);
    if (updated) {
      set((state) => ({
        barbers: state.barbers.map((b) =>
          b.id === barberId ? { ...b, isAvailable: updated.isAvailable } : b,
        ),
      }));
    }
  },
}));
