# API Module Documentation

## Overview

This module provides a centralized Axios configuration with JWT authentication, automatic token refresh, and typed API endpoints for the BioAttend application.

## Features

- **Automatic JWT Token Management**: Tokens are automatically attached to requests
- **Silent Token Refresh**: Automatically refreshes expired tokens without user intervention
- **Request Queuing**: Queues failed requests during token refresh and retries them
- **Typed API Endpoints**: Pre-configured endpoint functions for all API routes
- **TypeScript Support**: Full type definitions for all API requests and responses
- **Environment Configuration**: Base URL configured from environment variables

## Setup

### Environment Variables

Create a `.env` file in the project root with:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

### Installation

The required dependencies (axios and zustand) are already installed:

```bash
npm install axios zustand
```

## Usage

### Import API Functions

```javascript
import { authApi, attendanceApi, userApi, scheduleApi } from '@/api';
```

### Authentication

```javascript
// Login
try {
  const response = await authApi.login({
    email: 'user@example.com',
    password: 'password123'
  });
  
  // Tokens are automatically stored in Zustand store
  // User data is available in response.data.user
  console.log('Logged in:', response.data.user);
} catch (error) {
  console.error('Login failed:', error.response?.data);
}

// Logout
await authApi.logout();
// This clears tokens from store and localStorage
```

### Making API Calls

Once authenticated, the token is automatically attached to all requests:

```javascript
// Get user profile
const profile = await userApi.getProfile();

// Clock in for attendance
const attendance = await attendanceApi.clockIn({
  biometric_data: 'base64_encoded_data',
  location: {
    latitude: 1.234,
    longitude: 5.678
  }
});

// Get schedules
const schedules = await scheduleApi.getSchedules({
  date_from: '2024-01-01',
  date_to: '2024-01-31',
  page: 1,
  page_size: 20
});
```

## API Endpoints

### Authentication API (`authApi`)

- `login(credentials)` - User login
- `register(userData)` - User registration
- `logout()` - User logout
- `refreshToken(refreshToken)` - Refresh access token
- `verifyToken(token)` - Verify token validity
- `requestPasswordReset(email)` - Request password reset
- `confirmPasswordReset(data)` - Confirm password reset
- `changePassword(data)` - Change password

### Attendance API (`attendanceApi`)

- `clockIn(data)` - Clock in for attendance
- `clockOut(data)` - Clock out
- `getRecords(params)` - Get attendance records
- `getRecord(id)` - Get single record
- `updateRecord(id, data)` - Update record
- `deleteRecord(id)` - Delete record
- `getStatistics(params)` - Get statistics
- `getReport(params)` - Get attendance report
- `exportData(params)` - Export attendance data
- `verifyBiometric(data)` - Verify biometric data

### User API (`userApi`)

- `getProfile()` - Get current user profile
- `updateProfile(data)` - Update profile
- `getUsers(params)` - Get all users (admin)
- `getUser(id)` - Get single user
- `createUser(data)` - Create user (admin)
- `updateUser(id, data)` - Update user (admin)
- `deleteUser(id)` - Delete user (admin)
- `uploadProfilePicture(formData)` - Upload profile picture
- `registerBiometric(data)` - Register biometric data
- `updateBiometric(data)` - Update biometric data
- `getPermissions(userId?)` - Get user permissions
- `updatePermissions(userId, permissions)` - Update permissions (admin)

### Schedule API (`scheduleApi`)

- `getSchedules(params)` - Get schedules
- `getSchedule(id)` - Get single schedule
- `createSchedule(data)` - Create schedule
- `updateSchedule(id, data)` - Update schedule
- `deleteSchedule(id)` - Delete schedule
- `getUserSchedule(userId?, params)` - Get user schedule
- `getTemplates()` - Get schedule templates
- `createFromTemplate(templateId, data)` - Create from template
- `checkConflicts(data)` - Check schedule conflicts
- `bulkCreate(schedules)` - Bulk create schedules
- `getSummary(params)` - Get schedule summary

## Token Refresh Flow

1. When a request receives a 401 response, the interceptor automatically attempts to refresh the token
2. During refresh, all other requests are queued
3. If refresh succeeds:
   - New tokens are stored
   - Queued requests are retried with the new token
4. If refresh fails:
   - User is logged out
   - Redirected to login page
   - All queued requests are rejected

## Error Handling

```javascript
try {
  const data = await userApi.getProfile();
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data);
    console.error('Status:', error.response.status);
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server');
  } else {
    // Error in request setup
    console.error('Request error:', error.message);
  }
}
```

## TypeScript Types

Import types for better type safety:

```typescript
import {
  User,
  LoginCredentials,
  AttendanceRecord,
  Schedule,
  ApiResponse,
  PaginatedResponse
} from '@/api';

// Example usage
const handleLogin = async (credentials: LoginCredentials) => {
  const response: ApiResponse<LoginResponse> = await authApi.login(credentials);
  const user: User = response.data.user;
};
```

## Store Integration

The auth store (Zustand) is automatically integrated:

```javascript
import { useAuthStore } from '@/store';

// Access auth state in components
const Component = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.first_name}!</p>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
};
```

## Custom Requests

For custom requests not covered by the typed endpoints:

```javascript
import { axios } from '@/api';

// Custom GET request
const customData = await axios.get('/custom/endpoint/');

// Custom POST with data
const result = await axios.post('/custom/action/', {
  custom_field: 'value'
});
```

## Testing

A test file is provided at `src/api/test-axios.js` to verify the setup:

```javascript
import { testApiCalls } from '@/api/test-axios';

// Run test API calls
testApiCalls();
```

## Security Notes

1. Tokens are stored in localStorage via Zustand persist middleware
2. Access tokens are short-lived (configure on backend)
3. Refresh tokens should have longer expiry but still be rotated
4. Always use HTTPS in production
5. Implement CORS properly on the backend
6. Consider implementing request signing for sensitive operations

## Troubleshooting

### Token not being attached to requests
- Check if user is logged in: `useAuthStore.getState().isAuthenticated`
- Verify token exists: `useAuthStore.getState().accessToken`

### Infinite refresh loop
- Ensure `/auth/login` and `/auth/token/refresh/` endpoints are excluded from refresh logic
- Check backend refresh endpoint is working correctly

### CORS errors
- Verify `VITE_API_URL` matches backend URL
- Ensure backend has proper CORS configuration

### Request timeout
- Default timeout is 30 seconds
- Can be adjusted in `axios.js` configuration
