import { create } from 'zustand';

interface UIState {
    isDarkMode: boolean;
    isSidebarOpen: boolean;
    activeModal: string | null;
    toggleDarkMode: () => void;
    toggleSidebar: () => void;
    openModal: (modalName: string) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isDarkMode: true, // Default to dark mode as per "Professional" vibe
    isSidebarOpen: true,
    activeModal: null,

    toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    openModal: (modalName) => set({ activeModal: modalName }),
    closeModal: () => set({ activeModal: null }),
}));
