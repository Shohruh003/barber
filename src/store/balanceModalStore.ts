import { create } from "zustand";

interface BalanceModalStore {
  show: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useBalanceModalStore = create<BalanceModalStore>((set) => ({
  show: false,
  openModal: () => set({ show: true }),
  closeModal: () => set({ show: false }),
}));
