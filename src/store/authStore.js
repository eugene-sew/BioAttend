import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from 'zustand/middleware';
import { authApi } from '../api/axios';

/**
 * Authentication store for managing JWT tokens and user authentication state
 */
const useAuthStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isRefreshing: false,
        isLoading: false,
        error: null,

        // Actions
        setTokens: (accessToken, refreshToken) => {
          set({
            accessToken,
            refreshToken,
            isAuthenticated: !!accessToken,
          });
        },

        setAccessToken: (accessToken) => {
          set({
            accessToken,
            isAuthenticated: !!accessToken,
          });
        },

        setUser: (user) => {
          set({ user });
        },

        setRefreshing: (isRefreshing) => {
          set({ isRefreshing });
        },

        login: async (email, password) => {
          set({ isLoading: true, error: null });

          try {
            const { data } = await authApi.login({ email, password });

            // DRF SimpleJWT returns { access, refresh } and our backend also returns user
            set({
              accessToken: data.access,
              refreshToken: data.refresh,
              user: data.user ?? null,
              isAuthenticated: !!data.access,
              isLoading: false,
              isRefreshing: false,
              error: null,
            });

            return data;
          } catch (error) {
            const message = (error && error.response && error.response.data && (error.response.data.detail || error.response.data.error))
              || (error instanceof Error ? error.message : 'Login failed');
            set({ isLoading: false, error: message, isAuthenticated: false });
            throw error;
          }
        },

        // Alternative login method for pre-fetched data
        setAuthData: ({ accessToken, refreshToken, user }) => {
          set({
            accessToken,
            refreshToken,
            user,
            isAuthenticated: true,
            isRefreshing: false,
            error: null,
          });
        },

        logout: async () => {
          const { refreshToken } = get();
          set({ isLoading: true });

          try {
            if (refreshToken) {
              // Backend expects { refresh_token }
              await authApi.logout(refreshToken);
            }
          } catch (error) {
            // Non-fatal: we still clear local state
            console.error('Logout error:', error);
          } finally {
            set({
              accessToken: null,
              refreshToken: null,
              user: null,
              isAuthenticated: false,
              isRefreshing: false,
              isLoading: false,
              error: null,
            });
            // Clear any persisted data
            try { localStorage.removeItem('auth-storage'); } catch (e) { void e; }
          }
        },

        clearTokens: () => {
          set({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        },

        refreshAccessToken: async () => {
          const { refreshToken } = get();

          if (!refreshToken) {
            get().clearTokens();
            throw new Error('No refresh token available');
          }

          set({ isRefreshing: true });

          try {
            // SimpleJWT refresh: send { refresh }, receive { access }
            const { data } = await authApi.refreshToken(refreshToken);
            set({
              accessToken: data.access,
              refreshToken: data.refresh || refreshToken,
              isRefreshing: false,
            });
            return data.access;
          } catch (error) {
            get().clearTokens();
            set({ isRefreshing: false });
            throw error;
          }
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },

        setError: (error) => {
          set({ error });
        },

        // Getters
        getAccessToken: () => get().accessToken,
        getRefreshToken: () => get().refreshToken,
        getIsAuthenticated: () => get().isAuthenticated,
        getUser: () => get().user,
        getIsRefreshing: () => get().isRefreshing,
        getIsLoading: () => get().isLoading,
        getError: () => get().error,
      }),
      {
        name: 'auth-storage', // unique name for localStorage
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist these fields
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);

// Subscribe to authentication changes for redirects
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      const publicPaths = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
      ];
      const currentPath = window.location.pathname;

      if (!publicPaths.includes(currentPath)) {
        window.location.href = '/login';
      }
    }
  }
);

// Subscribe to token changes for API interceptors
useAuthStore.subscribe(
  (state) => state.accessToken,
  (accessToken) => {
    // Update axios default header for new tabs or manual calls
    try {
      // Lazy import to avoid circulars if any bundler quirks
      // We already imported authApi, but updating global axios defaults is fine
      if (window && window.axios) {
        if (accessToken) {
          window.axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } else {
          delete window.axios.defaults.headers.common['Authorization'];
        }
      }
    } catch (e) {
      // no-op: window may be undefined in SSR or tests
      void e;
    }
  }
);

// Selectors for common use cases
export const authSelectors = {
  selectUser: (state) => state.user,
  selectIsAuthenticated: (state) => state.isAuthenticated,
  selectIsRefreshing: (state) => state.isRefreshing,
  selectIsLoading: (state) => state.isLoading,
  selectError: (state) => state.error,
  selectAccessToken: (state) => state.accessToken,
};

export default useAuthStore;
