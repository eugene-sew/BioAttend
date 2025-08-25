import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import LoginPage from './LoginPage';
import useAuthStore from '../../store/authStore';

describe('LoginPage Integration Tests', () => {
  beforeEach(() => {
    // Reset auth store
    useAuthStore.getState().clearTokens();
  });

  it('should successfully login with valid credentials', async () => {
    const user = userEvent.setup();
    
    // Override the default handler for this test
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        return HttpResponse.json({
          accessToken: 'test_access_token',
          refreshToken: 'test_refresh_token',
          user: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'STUDENT',
          },
        });
      })
    );

    render(<LoginPage />);

    // Find and fill email input
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'john@example.com');

    // Find and fill password input
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Wait for successful login
    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('test_access_token');
      expect(state.user.email).toBe('john@example.com');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    
    // Mock failed login
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        return HttpResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 }
        );
      })
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'wrong@example.com');

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    // Verify user is not authenticated
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    server.use(
      http.post('/api/auth/login', () => {
        return HttpResponse.error();
      })
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    
    render(<LoginPage />);

    // Try to submit without filling fields
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Check for email validation message
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    
    // Add delay to response to test loading state
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: 1, name: 'Test User' },
        });
      })
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Check for loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find and click the toggle button
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    await user.click(toggleButton);

    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should navigate to forgot password page', async () => {
    const user = userEvent.setup();
    
    render(<LoginPage />);

    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await user.click(forgotPasswordLink);

    // Verify navigation occurred (you might need to adjust based on your routing setup)
    await waitFor(() => {
      expect(window.location.pathname).toBe('/forgot-password');
    });
  });

  it('should persist login state after successful login', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        return HttpResponse.json({
          accessToken: 'persistent_token',
          refreshToken: 'persistent_refresh',
          user: {
            id: 1,
            name: 'Persistent User',
            role: 'STUDENT',
          },
        });
      })
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });

    // Check localStorage persistence
    const storedData = JSON.parse(localStorage.getItem('auth-storage'));
    expect(storedData.state.accessToken).toBe('persistent_token');
    expect(storedData.state.user.name).toBe('Persistent User');
  });
});
