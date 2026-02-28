import { create } from "zustand";
import type { Barber } from "@/types";
import {
  fetchUserFavorites,
  fetchUserFavoriteIds,
  toggleFavoriteBarber,
} from "@/lib/apiClient";

interface FavoritesState {
  favoriteIds: Set<string>;
  favorites: Barber[];
  loading: boolean;

  loadFavoriteIds: () => Promise<void>;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (barberId: string) => Promise<void>;
  isFavorite: (barberId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  favoriteIds: new Set<string>(),
  favorites: [],
  loading: false,

  loadFavoriteIds: async () => {
    try {
      const ids = await fetchUserFavoriteIds();
      set({ favoriteIds: new Set(ids) });
    } catch {
      // silently fail
    }
  },

  loadFavorites: async () => {
    set({ loading: true });
    try {
      const favorites = await fetchUserFavorites();
      set({
        favorites,
        favoriteIds: new Set(favorites.map((b) => b.id)),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  toggleFavorite: async (barberId: string) => {
    const current = get().favoriteIds;
    const newIds = new Set(current);
    const wasFavorite = newIds.has(barberId);
    if (wasFavorite) {
      newIds.delete(barberId);
    } else {
      newIds.add(barberId);
    }
    set({ favoriteIds: newIds });

    try {
      await toggleFavoriteBarber(barberId);
    } catch {
      // Rollback
      const rollback = new Set(get().favoriteIds);
      if (wasFavorite) {
        rollback.add(barberId);
      } else {
        rollback.delete(barberId);
      }
      set({ favoriteIds: rollback });
    }
  },

  isFavorite: (barberId: string) => {
    return get().favoriteIds.has(barberId);
  },
}));
