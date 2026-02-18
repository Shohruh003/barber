import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "@/types";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          updateDocumentTheme(newTheme);
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        updateDocumentTheme(theme);
        set({ theme });
      },
    }),
    { name: "barber-theme" },
  ),
);

function updateDocumentTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// Initialize theme on load
export function initTheme() {
  const stored = localStorage.getItem("barber-theme");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      updateDocumentTheme(parsed.state?.theme || "light");
    } catch {
      updateDocumentTheme("light");
    }
  }
}
