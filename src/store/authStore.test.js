import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useAuthStore from './authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useAuthStore.setState({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isRefreshing: false,
        isLoading: false,
        error: null,
      });
    });
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('setTokens', () => {
    it('should set access and refresh tokens', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens('access_token', 'refresh_token');
      });

      expect(result.current.accessToken).toBe('access_token');
      expect(result.current.refreshToken).toBe('refresh_token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false when tokens are null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens(null, null);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user data', () => {
      const { result } = renderHook(() => useAuthStore());
      const userData = { id: 1, name: 'Test User', role: 'STUDENT' };

      act(() => {
        result.current.setUser(userData);
      });

      expect(result.current.user).toEqual(userData);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
          user: { id: 1, name: 'Test User', role: 'STUDENT' },
        }),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.accessToken).toBe('access_token');
      expect(result.current.refreshToken).toBe('refresh_token');
      expect(result.current.user).toEqual({ id: 1, name: 'Test User', role: 'STUDENT' });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should handle login failure', async () => {
      const { result } = renderHook(() => useAuthStore());

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      try {
        await act(async () => {
          await result.current.login('test@example.com', 'wrong_password');
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.accessToken).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear auth state on logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Set initial authenticated state
      act(() => {
        result.current.setAuthData({
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
          user: { id: 1, name: 'Test User' },
        });
      });

      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.accessToken).toBe(null);
      expect(result.current.refreshToken).toBe(null);
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear state even if server logout fails', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuthData({
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
          user: { id: 1, name: 'Test User' },
        });
      });

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.accessToken).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens('old_access_token', 'refresh_token');
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'new_access_token' }),
      });

      let newToken;
      await act(async () => {
        newToken = await result.current.refreshAccessToken();
      });

      expect(newToken).toBe('new_access_token');
      expect(result.current.accessToken).toBe('new_access_token');
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should clear tokens on refresh failure', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens('old_access_token', 'refresh_token');
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
      });

      try {
        await act(async () => {
          await result.current.refreshAccessToken();
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.accessToken).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should throw error when no refresh token available', async () => {
      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.refreshAccessToken();
        })
      ).rejects.toThrow('No refresh token available');
    });
  });

  describe('persistence', () => {
    it('should persist auth state to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuthData({
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
          user: { id: 1, name: 'Test User' },
        });
      });

      const storedData = JSON.parse(localStorage.getItem('auth-storage'));
      expect(storedData.state.accessToken).toBe('access_token');
      expect(storedData.state.refreshToken).toBe('refresh_token');
      expect(storedData.state.user).toEqual({ id: 1, name: 'Test User' });
      expect(storedData.state.isAuthenticated).toBe(true);
    });
  });
});
