export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'manager' | 'student' | 'teacher';
  department?: string;
  avatar?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface AuthState {
  // State
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  login: (email: string, password: string) => Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }>;
  setAuthData: (data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => void;
  logout: () => Promise<void>;
  clearTokens: () => void;
  refreshAccessToken: () => Promise<string>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Getters
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getIsAuthenticated: () => boolean;
  getUser: () => User | null;
  getIsRefreshing: () => boolean;
  getIsLoading: () => boolean;
  getError: () => string | null;
}

declare const useAuthStore: () => AuthState;
export default useAuthStore;
