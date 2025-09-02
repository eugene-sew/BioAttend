/* eslint-disable no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import useAuthStore from '../../store/authStore';

// Mock the auth store
vi.mock('../../store/authStore');

const TestComponent = ({ role }) => <div>Protected Content - Role: {role}</div>;
const LoginPage = () => <div>Login Page</div>;
const ForbiddenPage = () => <div>403 Forbidden</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication checks', () => {
    it('should redirect to login when user is not authenticated', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent role="any" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText(/Protected Content/)).not.toBeInTheDocument();
    });

    it('should render children when user is authenticated', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: 'Test User', role: 'STUDENT' },
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent role="student" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content - Role: student')).toBeInTheDocument();
    });

    it('should not require authentication when requireAuth is false', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/public']}>
          <Routes>
            <Route
              path="/public"
              element={
                <ProtectedRoute requireAuth={false}>
                  <TestComponent role="public" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content - Role: public')).toBeInTheDocument();
    });

    it('should show loading spinner when authenticated but user data not loaded', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent role="loading" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show loading spinner
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText(/Protected Content/)).not.toBeInTheDocument();
    });
  });

  describe('Role-based access control', () => {
    it('should allow access when user has required role', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: 'Admin User', role: 'ADMIN' },
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <TestComponent role="admin" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content - Role: admin')).toBeInTheDocument();
    });

    it('should allow access when user has one of multiple required roles', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: 'Faculty User', role: 'FACULTY' },
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['ADMIN', 'FACULTY']}>
                  <TestComponent role="faculty" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content - Role: faculty')).toBeInTheDocument();
    });

    it('should redirect to 403 when user lacks required role', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: 'Student User', role: 'STUDENT' },
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/403" element={<ForbiddenPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <TestComponent role="admin" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('403 Forbidden')).toBeInTheDocument();
      expect(screen.queryByText(/Protected Content/)).not.toBeInTheDocument();
    });

    it('should handle user_type field as alternative to role field', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: 'Faculty User', user_type: 'FACULTY' },
      });

      render(
        <MemoryRouter initialEntries={['/faculty']}>
          <Routes>
            <Route
              path="/faculty"
              element={
                <ProtectedRoute roles={['FACULTY']}>
                  <TestComponent role="faculty" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content - Role: faculty')).toBeInTheDocument();
    });

    it('should handle case-insensitive role comparison', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: 'Admin User', role: 'admin' }, // lowercase
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}> {/* uppercase */}
                  <TestComponent role="admin" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content - Role: admin')).toBeInTheDocument();
    });

    it('should allow access when no roles are specified', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: 'Any User', role: 'STUDENT' },
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent role="any" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content - Role: any')).toBeInTheDocument();
    });
  });

  describe('Navigation state preservation', () => {
    it('should preserve location state when redirecting to login', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      const { container } = render(
        <MemoryRouter initialEntries={['/protected/resource']}>
          <Routes>
            <Route 
              path="/login" 
              element={
                <div>
                  <LoginPage />
                  <Route path="*" element={({ location }) => (
                    <div>From: {location.state?.from?.pathname}</div>
                  )} />
                </div>
              } 
            />
            <Route
              path="/protected/resource"
              element={
                <ProtectedRoute>
                  <TestComponent role="protected" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing user role gracefully', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: 'User Without Role' }, // no role field
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/403" element={<ForbiddenPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <TestComponent role="admin" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('403 Forbidden')).toBeInTheDocument();
    });

    it('should handle empty roles array', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: 'Test User', role: 'STUDENT' },
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute roles={[]}>
                  <TestComponent role="any" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content - Role: any')).toBeInTheDocument();
    });
  });
});
