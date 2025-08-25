import React, { useState } from 'react';
import { useAuthStore, useUIStore, useAttendanceStore } from '../store';
import { useModal } from './ui/GlobalModal';

/**
 * Demo component showing how to use the Zustand stores
 * This is for development/testing purposes
 */
const StoreDemo = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');

  // Auth store hooks
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // UI store hooks
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const showWarning = useUIStore((state) => state.showWarning);
  const showInfo = useUIStore((state) => state.showInfo);
  const setLoading = useUIStore((state) => state.setLoading);

  // Attendance store hooks
  const connectionStatus = useAttendanceStore((state) => state.connectionStatus);
  const recentUpdates = useAttendanceStore((state) => state.recentUpdates);

  // Modal hook
  const modal = useModal();

  // Demo handlers
  const handleLogin = async () => {
    try {
      setLoading('login', true);
      await login(email, password);
      showSuccess('Login successful!');
    } catch (err) {
      showError(err.message || 'Login failed');
    } finally {
      setLoading('login', false);
    }
  };

  const handleLogout = async () => {
    modal.openConfirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      variant: 'warning',
      onConfirm: async () => {
        await logout();
        showInfo('You have been logged out');
      },
    });
  };

  const handleTestToasts = () => {
    showSuccess('This is a success message!');
    setTimeout(() => showError('This is an error message!'), 500);
    setTimeout(() => showWarning('This is a warning message!'), 1000);
    setTimeout(() => showInfo('This is an info message!'), 1500);
  };

  const handleTestModal = () => {
    modal.openForm({
      title: 'Sample Form',
      fields: [
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea', rows: 4 },
      ],
      onSubmit: async (values) => {
        console.log('Form submitted:', values);
        showSuccess('Form submitted successfully!');
      },
    });
  };

  const handleSimulateAttendance = () => {
    // Simulate attendance update
    useAttendanceStore.getState().handleAttendanceUpdate({
      type: 'student_checked_in',
      payload: {
        schedule_id: 'SCH001',
        student_id: 'STU001',
        student_name: 'John Doe',
        check_in_time: new Date().toISOString(),
      },
    });
    showInfo('Simulated attendance check-in');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Zustand Store Demo
        </h2>

        {/* Auth Section */}
        <div className="mb-6 p-4 border rounded-lg dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Auth Store
          </h3>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm">
              <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
            </p>
            {user && (
              <p className="text-sm">
                <strong>User:</strong> {user.name} ({user.email})
              </p>
            )}
            {error && (
              <p className="text-sm text-red-500">
                <strong>Error:</strong> {error}
              </p>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          )}
        </div>

        {/* UI Store Section */}
        <div className="mb-6 p-4 border rounded-lg dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            UI Store
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm">Theme: {theme}</span>
              <button
                onClick={toggleTheme}
                className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Toggle Theme
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleTestToasts}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Test Toasts
              </button>
              <button
                onClick={handleTestModal}
                className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Test Modal
              </button>
              <button
                onClick={() => modal.openAlert({
                  title: 'Alert',
                  message: 'This is an alert message!',
                  variant: 'warning',
                })}
                className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Test Alert
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Store Section */}
        <div className="p-4 border rounded-lg dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Attendance Store
          </h3>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm">
              <strong>Connection:</strong>{' '}
              {connectionStatus.isConnected ? (
                <span className="text-green-500">Connected</span>
              ) : (
                <span className="text-red-500">Disconnected</span>
              )}
            </p>
            <p className="text-sm">
              <strong>Recent Updates:</strong> {recentUpdates.length}
            </p>
          </div>

          <button
            onClick={handleSimulateAttendance}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Simulate Attendance Update
          </button>

          {recentUpdates.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Recent Updates:</h4>
              {recentUpdates.slice(0, 3).map((update, index) => (
                <div key={index} className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  {update.type}: {update.student_name || update.student_id}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDemo;
