import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { loginAPI, registerAPI, updateProfile, uploadAvatar } from "@/lib/apiClient";

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
    role: "user" | "barber";
  }) => Promise<void>;
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

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await loginAPI(email, password);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({ error: "Email yoki parol noto'g'ri", isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await registerAPI(data);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({ error: "Ro'yxatdan o'tishda xatolik", isLoading: false });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null });
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
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
