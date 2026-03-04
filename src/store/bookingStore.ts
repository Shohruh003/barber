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
import type { FetchBarbersParams } from "@/lib/apiClient";

interface BookingState {
  // Barbers
  barbers: Barber[];
  selectedBarber: Barber | null;
  barbersLoading: boolean;
  barbersPage: number;
  barbersHasMore: boolean;
  barbersTotal: number;

  // Booking flow - multi-service
  selectedServices: Service[];
  selectedDate: string | null;
  selectedTime: string | null;
  bookedSlots: string[];
  customDaySlots: string[] | null; // barber's custom slots for selected date

  // Bookings list
  bookings: Booking[];
  bookingsLoading: boolean;
  bookingsPage: number;
  bookingsHasMore: boolean;

  // Actions - Barbers
  loadBarbers: (params?: FetchBarbersParams) => Promise<void>;
  loadMoreBarbers: (params?: FetchBarbersParams) => Promise<void>;
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
  loadMoreUserBookings: (userId: string) => Promise<void>;
  loadBarberBookings: (barberId: string) => Promise<void>;
  loadMoreBarberBookings: (barberId: string) => Promise<void>;
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
  barbersPage: 1,
  barbersHasMore: true,
  barbersTotal: 0,

  selectedServices: [],
  selectedDate: null,
  selectedTime: null,
  bookedSlots: [],
  customDaySlots: null,

  bookings: [],
  bookingsLoading: false,
  bookingsPage: 1,
  bookingsHasMore: true,

  loadBarbers: async (params) => {
    set({ barbersLoading: true });
    const result = await fetchBarbers({ ...params, page: 1 });
    set({
      barbers: result.data,
      barbersLoading: false,
      barbersPage: 1,
      barbersHasMore: result.meta.hasMore,
      barbersTotal: result.meta.total,
    });
  },

  loadMoreBarbers: async (params) => {
    const { barbersPage, barbersHasMore, barbersLoading } = get();
    if (!barbersHasMore || barbersLoading) return;
    set({ barbersLoading: true });
    const nextPage = barbersPage + 1;
    const result = await fetchBarbers({ ...params, page: nextPage });
    set((state) => ({
      barbers: [...state.barbers, ...result.data],
      barbersLoading: false,
      barbersPage: nextPage,
      barbersHasMore: result.meta.hasMore,
      barbersTotal: result.meta.total,
    }));
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
      userName: "",
      userAvatar: "",
      services,
      date,
      time,
      status: "confirmed",
      totalPrice,
      totalDuration,
      notes,
    });
    set((state) => ({ bookings: [booking, ...state.bookings] }));

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
    const result = await fetchUserBookings(userId, 1);
    set({ bookings: result.data, bookingsLoading: false, bookingsPage: 1, bookingsHasMore: result.meta.hasMore });
  },

  loadMoreUserBookings: async (userId) => {
    const { bookingsPage, bookingsHasMore, bookingsLoading } = get();
    if (!bookingsHasMore || bookingsLoading) return;
    set({ bookingsLoading: true });
    const nextPage = bookingsPage + 1;
    const result = await fetchUserBookings(userId, nextPage);
    set((state) => ({
      bookings: [...state.bookings, ...result.data],
      bookingsLoading: false,
      bookingsPage: nextPage,
      bookingsHasMore: result.meta.hasMore,
    }));
  },

  loadBarberBookings: async (barberId) => {
    set({ bookingsLoading: true });
    const result = await fetchBarberBookings(barberId, 1);
    set({ bookings: result.data, bookingsLoading: false, bookingsPage: 1, bookingsHasMore: result.meta.hasMore });
  },

  loadMoreBarberBookings: async (barberId) => {
    const { bookingsPage, bookingsHasMore, bookingsLoading } = get();
    if (!bookingsHasMore || bookingsLoading) return;
    set({ bookingsLoading: true });
    const nextPage = bookingsPage + 1;
    const result = await fetchBarberBookings(barberId, nextPage);
    set((state) => ({
      bookings: [...state.bookings, ...result.data],
      bookingsLoading: false,
      bookingsPage: nextPage,
      bookingsHasMore: result.meta.hasMore,
    }));
  },

  loadAllBookings: async () => {
    set({ bookingsLoading: true });
    const bookings = await fetchAllBookings();
    set({ bookings, bookingsLoading: false });
  },

  cancelUserBooking: async (bookingId) => {
    await cancelBooking(bookingId);
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "cancelled" as const } : b,
      ),
    }));
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
