/**
 * Test file to verify axios configuration
 * This file can be deleted after verification
 */

import { authApi, attendanceApi, userApi, scheduleApi } from './axios';
import useAuthStore from '../store/authStore';

// Test auth store integration
console.log('Auth Store State:', useAuthStore.getState());

// Test API endpoint availability
console.log('Available API Endpoints:');
console.log('Auth API:', Object.keys(authApi));
console.log('Attendance API:', Object.keys(attendanceApi));
console.log('User API:', Object.keys(userApi));
console.log('Schedule API:', Object.keys(scheduleApi));

// Example usage:
const testApiCalls = async () => {
  try {
    // Example login
    const loginResponse = await authApi.login({
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Login successful:', loginResponse.data);
    
    // The auth store will automatically be updated via interceptors
    // and the token will be attached to subsequent requests
    
    // Example: Get user profile (will automatically include auth token)
    const profileResponse = await userApi.getProfile();
    console.log('User profile:', profileResponse.data);
    
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
};

// Export for testing
export { testApiCalls };
