import { create } from "zustand";
import type { BarberNotification } from "@/types";
import {
  fetchBarberNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/apiClient";

interface NotificationState {
  notifications: BarberNotification[];
  loading: boolean;

  loadNotifications: (barberId: string) => Promise<void>;
  addNotification: (
    notification: Omit<BarberNotification, "id" | "createdAt" | "isRead">,
  ) => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: (barberId: string) => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  loading: false,

  loadNotifications: async (barberId) => {
    set({ loading: true });
    const notifications = await fetchBarberNotifications(barberId);
    set({ notifications, loading: false });
  },

  addNotification: async (notification) => {
    const created = await createNotification(notification);
    set((state) => ({
      notifications: [created, ...state.notifications],
    }));
  },

  markRead: async (notificationId) => {
    await markNotificationRead(notificationId);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n,
      ),
    }));
  },

  markAllRead: async (barberId) => {
    await markAllNotificationsRead(barberId);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.barberId === barberId ? { ...n, isRead: true } : n,
      ),
    }));
  },

  unreadCount: () => {
    return get().notifications.filter((n) => !n.isRead).length;
  },
}));
