import { create } from "zustand";

interface CreateProjectModalStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useCreateProjectModal = create<CreateProjectModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
