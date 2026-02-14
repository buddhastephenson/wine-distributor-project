import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '../../shared/types';
import { authApi } from '../services/api';

interface AuthState {
    user: IUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    originalUser: IUser | null;
    login: (credentials: any) => Promise<void>;
    signup: (data: any) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    impersonate: (user: IUser) => void;
    stopImpersonating: () => void;
    verifySession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            originalUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.login(credentials);
                    if (response.data.success && response.data.user) {
                        set({ user: response.data.user, isAuthenticated: true, isLoading: false });
                    } else {
                        set({ error: response.data.error || 'Login failed', isLoading: false });
                    }
                } catch (error: any) {
                    set({
                        error: error.response?.data?.error || 'Login failed',
                        isLoading: false
                    });
                }
            },

            signup: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.signup(data);
                    if (response.data.success) {
                        if (response.data.user) {
                            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
                        } else {
                            // Pending status - success but no login
                            set({ isLoading: false, error: null });
                        }
                    } else {
                        set({ error: response.data.error || 'Signup failed', isLoading: false });
                    }
                } catch (error: any) {
                    set({
                        error: error.response?.data?.error || 'Signup failed',
                        isLoading: false
                    });
                }
            },

            verifySession: async () => {
                // If not authenticated in state, don't bother verify (unless we want to support cookie-based persistence without local storage)
                // But since we persist zustand, we might be "authenticated" but stale.
                if (!get().isAuthenticated) return;

                set({ isLoading: true });
                try {
                    const response = await authApi.verify();
                    if (response.data.success && response.data.user) {
                        set({ user: response.data.user, isAuthenticated: true, isLoading: false });
                    } else {
                        // If token invalid, logout
                        set({ user: null, isAuthenticated: false, isLoading: false });
                    }
                } catch (error) {
                    console.error('Session verification failed', error);
                    // If 401, logout
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },

            logout: () => set({ user: null, isAuthenticated: false, originalUser: null }),
            clearError: () => set({ error: null }),

            impersonate: (user) => {
                const currentUser = get().user;
                // Only allow if currently admin or already impersonating (which implies original was admin)
                if (currentUser?.type === 'admin' || get().originalUser) {
                    set((state) => ({
                        originalUser: state.originalUser || currentUser, // Keep original if already set
                        user: user,
                        isAuthenticated: true
                    }));
                }
            },

            stopImpersonating: () => {
                const original = get().originalUser;
                if (original) {
                    set({
                        user: original,
                        originalUser: null,
                        isAuthenticated: true
                    });
                }
            }
        }),
        {
            name: 'auth-storage', // unique name
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                originalUser: state.originalUser
            }),
        }
    )
);
