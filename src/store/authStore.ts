import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { loginAPI, registerAPI, updateProfile } from "@/lib/apiClient";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await loginAPI(email, password);
          set({ user, token, isLoading: false });
        } catch {
          set({ error: "Login xatolik yuz berdi", isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await registerAPI(data);
          set({ user, token, isLoading: false });
        } catch {
          set({ error: "Ro'yxatdan o'tishda xatolik", isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },

      updateUser: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const user = get().user;
          if (!user) return;
          const updated = await updateProfile(user.id, data);
          set({ user: updated, isLoading: false });
        } catch {
          set({ error: "Profilni yangilashda xatolik", isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "barber-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
