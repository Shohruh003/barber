import { create } from "zustand";
import type { UserNotification } from "@/types";
import {
  fetchUserNotifications,
  markUserNotificationRead,
  markAllUserNotificationsRead,
} from "@/lib/apiClient";

interface UserNotificationState {
  notifications: UserNotification[];
  loading: boolean;
  loadNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  unreadCount: number;
}

export const useUserNotificationStore = create<UserNotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  loadNotifications: async () => {
    set({ loading: true });
    try {
      const data = await fetchUserNotifications();
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.isRead).length,
      });
    } catch {
      // silently fail
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      await markUserNotificationRead(id);
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        );
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        };
      });
    } catch {
      // silently fail
    }
  },

  markAllRead: async () => {
    try {
      await markAllUserNotificationsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // silently fail
    }
  },
}));
