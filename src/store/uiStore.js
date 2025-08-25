import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';

/**
 * UI store for managing global UI state including toasts, modals, and theme
 */
const useUIStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Theme state
        theme: 'light', // 'light' | 'dark' | 'system'
        
        // Toast notifications
        toasts: [],
        toastIdCounter: 0,
        
        // Modal state
        modals: {
          isOpen: false,
          activeModal: null,
          modalData: null,
        },
        
        // Sidebar state
        sidebar: {
          isOpen: true,
          isMobileOpen: false,
        },
        
        // Loading states
        loadingStates: {},
        
        // Global app state
        isAppLoading: false,
        appError: null,
        
        // Actions for Theme
        setTheme: (theme) => {
          set({ theme });
          
          // Apply theme to document
          if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            
            if (theme === 'system') {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              root.classList.toggle('dark', prefersDark);
            } else {
              root.classList.toggle('dark', theme === 'dark');
            }
            
            // Save to localStorage for immediate access on page load
            localStorage.setItem('theme', theme);
          }
        },
        
        toggleTheme: () => {
          const currentTheme = get().theme;
          const themes = ['light', 'dark', 'system'];
          const currentIndex = themes.indexOf(currentTheme);
          const nextIndex = (currentIndex + 1) % themes.length;
          get().setTheme(themes[nextIndex]);
        },
        
        // Actions for Toasts
        addToast: (toast) => {
          const id = get().toastIdCounter + 1;
          const newToast = {
            id,
            type: 'info', // default type
            duration: 5000, // default 5 seconds
            ...toast,
            timestamp: Date.now(),
          };
          
          set((state) => ({
            toasts: [...state.toasts, newToast],
            toastIdCounter: id,
          }));
          
          // Auto-remove toast after duration
          if (newToast.duration > 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, newToast.duration);
          }
          
          return id;
        },
        
        removeToast: (id) => {
          set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
          }));
        },
        
        clearToasts: () => {
          set({ toasts: [] });
        },
        
        // Toast helper methods
        showSuccess: (message, options = {}) => {
          return get().addToast({
            type: 'success',
            message,
            ...options,
          });
        },
        
        showError: (message, options = {}) => {
          return get().addToast({
            type: 'error',
            message,
            duration: 7000, // Errors stay longer
            ...options,
          });
        },
        
        showWarning: (message, options = {}) => {
          return get().addToast({
            type: 'warning',
            message,
            ...options,
          });
        },
        
        showInfo: (message, options = {}) => {
          return get().addToast({
            type: 'info',
            message,
            ...options,
          });
        },
        
        // Actions for Modals
        openModal: (modalName, data = null) => {
          set({
            modals: {
              isOpen: true,
              activeModal: modalName,
              modalData: data,
            },
          });
        },
        
        closeModal: () => {
          set({
            modals: {
              isOpen: false,
              activeModal: null,
              modalData: null,
            },
          });
        },
        
        updateModalData: (data) => {
          set((state) => ({
            modals: {
              ...state.modals,
              modalData: data,
            },
          }));
        },
        
        // Actions for Sidebar
        toggleSidebar: () => {
          set((state) => ({
            sidebar: {
              ...state.sidebar,
              isOpen: !state.sidebar.isOpen,
            },
          }));
        },
        
        toggleMobileSidebar: () => {
          set((state) => ({
            sidebar: {
              ...state.sidebar,
              isMobileOpen: !state.sidebar.isMobileOpen,
            },
          }));
        },
        
        setSidebarOpen: (isOpen) => {
          set((state) => ({
            sidebar: {
              ...state.sidebar,
              isOpen,
            },
          }));
        },
        
        setMobileSidebarOpen: (isMobileOpen) => {
          set((state) => ({
            sidebar: {
              ...state.sidebar,
              isMobileOpen,
            },
          }));
        },
        
        // Actions for Loading States
        setLoading: (key, isLoading) => {
          set((state) => ({
            loadingStates: {
              ...state.loadingStates,
              [key]: isLoading,
            },
          }));
        },
        
        isLoading: (key) => {
          return get().loadingStates[key] || false;
        },
        
        clearLoading: (key) => {
          set((state) => {
            const { [key]: _, ...rest } = state.loadingStates;
            return { loadingStates: rest };
          });
        },
        
        clearAllLoading: () => {
          set({ loadingStates: {} });
        },
        
        // Actions for Global App State
        setAppLoading: (isLoading) => {
          set({ isAppLoading: isLoading });
        },
        
        setAppError: (error) => {
          set({ appError: error });
          
          // Show error toast if error is provided
          if (error) {
            get().showError(
              typeof error === 'string' ? error : error.message || 'An error occurred'
            );
          }
        },
        
        clearAppError: () => {
          set({ appError: null });
        },
        
        // Utility function to reset UI state
        resetUIState: () => {
          set({
            toasts: [],
            modals: {
              isOpen: false,
              activeModal: null,
              modalData: null,
            },
            loadingStates: {},
            isAppLoading: false,
            appError: null,
          });
        },
      }),
      {
        name: 'ui-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist theme and sidebar preferences
          theme: state.theme,
          sidebar: state.sidebar,
        }),
      }
    )
  )
);

// Initialize theme on app load
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    const root = window.document.documentElement;
    
    if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', savedTheme === 'dark');
    }
  }
  
  // Listen for system theme changes when theme is set to 'system'
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useUIStore.getState();
    if (state.theme === 'system') {
      const root = window.document.documentElement;
      root.classList.toggle('dark', e.matches);
    }
  });
}

// Selectors for common use cases
export const uiSelectors = {
  selectTheme: (state) => state.theme,
  selectToasts: (state) => state.toasts,
  selectActiveModal: (state) => state.modals.activeModal,
  selectModalData: (state) => state.modals.modalData,
  selectIsModalOpen: (state) => state.modals.isOpen,
  selectIsSidebarOpen: (state) => state.sidebar.isOpen,
  selectIsMobileSidebarOpen: (state) => state.sidebar.isMobileOpen,
  selectIsAppLoading: (state) => state.isAppLoading,
  selectAppError: (state) => state.appError,
  selectLoadingState: (key) => (state) => state.loadingStates[key] || false,
};

export default useUIStore;
