import { create } from "zustand";
import type { BarberDaySchedule, BlockedSlot, Barber } from "@/types";
import {
  fetchBarberDaySchedule,
  saveBarberDaySchedule,
  fetchBlockedSlots,
  toggleBlockSlot,
  updateBarberSlotDuration,
  fetchBarberById,
} from "@/lib/apiClient";

interface BarberScheduleState {
  barber: Barber | null;
  barberLoading: boolean;
  daySchedule: BarberDaySchedule | null;
  blockedSlots: BlockedSlot[];
  scheduleLoading: boolean;

  loadBarber: (barberId: string) => Promise<void>;
  loadDaySchedule: (barberId: string, date: string) => Promise<void>;
  saveDaySchedule: (schedule: BarberDaySchedule) => Promise<void>;
  loadBlockedSlots: (barberId: string, date: string) => Promise<void>;
  toggleBlock: (barberId: string, date: string, time: string) => Promise<void>;
  updateSlotDuration: (barberId: string, duration: number) => Promise<void>;
}

export const useBarberScheduleStore = create<BarberScheduleState>()(
  (set) => ({
    barber: null,
    barberLoading: false,
    daySchedule: null,
    blockedSlots: [],
    scheduleLoading: false,

    loadBarber: async (barberId) => {
      set({ barberLoading: true });
      const barber = await fetchBarberById(barberId);
      set({ barber, barberLoading: false });
    },

    loadDaySchedule: async (barberId, date) => {
      set({ scheduleLoading: true });
      const [daySchedule, blocked] = await Promise.all([
        fetchBarberDaySchedule(barberId, date),
        fetchBlockedSlots(barberId, date),
      ]);
      set({ daySchedule, blockedSlots: blocked, scheduleLoading: false });
    },

    saveDaySchedule: async (schedule) => {
      const saved = await saveBarberDaySchedule(schedule);
      set({ daySchedule: saved });
    },

    loadBlockedSlots: async (barberId, date) => {
      const blocked = await fetchBlockedSlots(barberId, date);
      set({ blockedSlots: blocked });
    },

    toggleBlock: async (barberId, date, time) => {
      const isBlocked = await toggleBlockSlot(barberId, date, time);
      set((state) => {
        if (isBlocked) {
          return {
            blockedSlots: [...state.blockedSlots, { barberId, date, time }],
          };
        }
        return {
          blockedSlots: state.blockedSlots.filter(
            (s) => !(s.barberId === barberId && s.date === date && s.time === time),
          ),
        };
      });
    },

    updateSlotDuration: async (barberId, duration) => {
      const updated = await updateBarberSlotDuration(barberId, duration);
      if (updated) {
        set({ barber: updated });
      }
    },
  }),
);
