// Store barrel exports
// Export all Zustand stores from this file

// Main stores
export { default as useAuthStore, authSelectors } from './authStore';
export { default as useAttendanceStore, attendanceSelectors } from './attendanceStore';
export { default as useUIStore, uiSelectors } from './uiStore';

// Re-export commonly used types
export type { User } from './authStore';

// Utility function to reset all stores (useful for logout)
export const resetAllStores = () => {
  useAuthStore.getState().logout();
  useAttendanceStore.getState().clearAllAttendance();
  useUIStore.getState().resetUIState();
};
