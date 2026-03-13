import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { loginAPI, registerAPI, fetchMeAPI, updateProfile, uploadAvatar, registerDeviceAPI } from "@/lib/apiClient";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (phone: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    phone: string;
    password: string;
    role: "user" | "barber";
    gender?: "MALE" | "FEMALE";
  }) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User> & { oldPassword?: string; newPassword?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (phone, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await loginAPI(phone, password);
          set({ user, token, isLoading: false });
          // Register FCM token for push notifications
          try {
            const fcmToken = (window as any).Android?.getFcmToken?.();
            if (fcmToken) registerDeviceAPI(fcmToken);
          } catch {}
        } catch (err) {
          set({ error: "Telefon raqam yoki parol noto'g'ri", isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await registerAPI(data);
          set({ user, token, isLoading: false });
          // Register FCM token for push notifications
          try {
            const fcmToken = (window as any).Android?.getFcmToken?.();
            if (fcmToken) registerDeviceAPI(fcmToken);
          } catch {}
        } catch (err) {
          set({ error: "Ro'yxatdan o'tishda xatolik", isLoading: false });
          throw err;
        }
      },

      loadUser: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const user = await fetchMeAPI();
          set({ user });
        } catch {
          set({ user: null, token: null });
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.clear();
        sessionStorage.clear();
        // Clear service worker & browser caches
        if ("caches" in window) {
          caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
        }
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((regs) =>
            regs.forEach((reg) => reg.unregister()),
          );
        }
      },

      updateUser: async (data) => {
        set({ isLoading: true, error: null });
        const user = get().user;
        if (!user) return;
        try {
          const updated = await updateProfile(user.id, data);
          set({ user: updated, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      uploadAvatar: async (file: File) => {
        const user = get().user;
        if (!user) return;
        try {
          const updated = await uploadAvatar(user.id, file);
          set({ user: updated });
        } catch (err) {
          throw err;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "barber-auth",
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
