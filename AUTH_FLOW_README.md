# Authentication Flow Documentation

## Overview
The authentication flow for BioAttend has been successfully implemented with the following features:
- Login page with form validation
- Password reset request flow
- Password reset confirmation
- Token-based authentication with JWT
- Persistent authentication state using Zustand
- Automatic token refresh
- Protected routes
- Toast notifications for user feedback
- Loading states and error handling

## Components Created

### 1. LoginPage (`/src/pages/auth/LoginPage.jsx`)
- **Purpose**: Main login interface for users
- **Features**:
  - React Hook Form for form management
  - Email and password validation
  - Remember me checkbox
  - Loading spinner during authentication
  - Error handling with toast notifications
  - Tailwind CSS styling
  - Links to password reset and registration

### 2. LoginPageMUI (`/src/pages/auth/LoginPageMUI.jsx`) 
- **Purpose**: Alternative login page using Material-UI components
- **Features**:
  - Same functionality as LoginPage but with MUI components
  - Can be used by importing from auth pages and updating routes

### 3. PasswordResetRequest (`/src/pages/auth/PasswordResetRequest.jsx`)
- **Purpose**: Request password reset via email
- **Features**:
  - Email validation
  - Success confirmation screen
  - Retry functionality
  - Loading states
  - Error handling

### 4. PasswordResetConfirm (`/src/pages/auth/PasswordResetConfirm.jsx`)
- **Purpose**: Set new password using reset token
- **Features**:
  - Token validation from URL parameters
  - Password strength requirements
  - Password confirmation matching
  - Success screen with auto-redirect
  - Invalid/expired token handling

### 5. LoadingSpinner (`/src/components/common/LoadingSpinner.jsx`)
- **Purpose**: Reusable loading spinner component
- **Features**:
  - Configurable size (sm, md, lg, xl)
  - Configurable color
  - Smooth animation

## Authentication Store (Zustand)

The authentication store (`/src/store/authStore.js`) manages:
- `accessToken`: JWT access token
- `refreshToken`: JWT refresh token
- `user`: User object with profile data
- `isAuthenticated`: Boolean authentication state
- `isRefreshing`: Token refresh state

### Key Methods:
- `login()`: Store tokens and user data
- `logout()`: Clear authentication state
- `setTokens()`: Update tokens
- `setUser()`: Update user profile

### Persistence:
- Authentication state is persisted to localStorage
- Automatic rehydration on app reload
- Key: `auth-storage`

## API Integration

### Authentication Endpoints (`/src/api/axios.js`)
```javascript
authApi.login(credentials)           // POST /auth/login/
authApi.requestPasswordReset(email)  // POST /auth/password/reset/
authApi.confirmPasswordReset(data)   // POST /auth/password/reset/confirm/
authApi.logout()                     // POST /auth/logout/
authApi.refreshToken(refreshToken)   // POST /auth/token/refresh/
```

### Axios Interceptors:
1. **Request Interceptor**: Automatically adds Bearer token to requests
2. **Response Interceptor**: Handles 401 errors and token refresh
3. **Token Refresh Queue**: Queues requests during token refresh

## Routing Setup

```javascript
// Public Routes
/login              - Login page
/forgot-password    - Password reset request
/reset-password     - Password reset confirmation (requires ?token=)

// Protected Routes  
/dashboard          - Main dashboard (requires authentication)
/                   - Redirects to dashboard
```

## Form Validation Rules

### Login Form:
- **Email**: Required, valid email format
- **Password**: Required, minimum 6 characters

### Password Reset Request:
- **Email**: Required, valid email format

### Password Reset Confirmation:
- **New Password**: 
  - Required
  - Minimum 8 characters
  - Must contain uppercase, lowercase, number, and special character
- **Confirm Password**: Must match new password

## Toast Notifications

Configured with react-hot-toast:
- Position: Top-right
- Duration: 4 seconds
- Success: Green background (#10b981)
- Error: Red background (#ef4444)
- Default: Dark background (#363636)

## Usage Examples

### Logging In:
```javascript
// User enters email and password
// On submit, calls authApi.login()
// On success:
// - Stores tokens in authStore
// - Shows success toast
// - Redirects to dashboard
```

### Requesting Password Reset:
```javascript
// User enters email
// On submit, calls authApi.requestPasswordReset()
// On success:
// - Shows confirmation screen
// - User checks email for reset link
```

### Resetting Password:
```javascript
// User clicks link in email with token
// Opens /reset-password?token=xxx
// User enters new password
// On submit, calls authApi.confirmPasswordReset()
// On success:
// - Shows success message
// - Auto-redirects to login after 3 seconds
```

## Security Features

1. **Token Storage**: Tokens stored in Zustand with localStorage persistence
2. **Automatic Token Refresh**: Interceptor handles token refresh on 401
3. **Protected Routes**: ProtectedRoute component checks authentication
4. **Password Requirements**: Strong password validation rules
5. **HTTPS**: API calls use secure endpoints (configure in production)

## Environment Variables

Required in `.env`:
```
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## Testing the Authentication Flow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to login page**:
   - Open http://localhost:5173/login

3. **Test login flow**:
   - Enter valid credentials
   - Submit form
   - Verify redirect to dashboard
   - Check localStorage for `auth-storage`

4. **Test password reset**:
   - Click "Forgot your password?"
   - Enter email
   - Check confirmation screen
   - Test reset link with token

5. **Test protected routes**:
   - Try accessing /dashboard without login
   - Verify redirect to /login
   - Login and verify access

## Customization Options

### Switching to Material-UI:
To use the MUI version of login:
1. Update import in App.jsx:
   ```javascript
   import { LoginPageMUI as LoginPage } from './pages/auth';
   ```
2. Ensure MUI theme is configured

### Styling:
- Tailwind classes can be customized in components
- Colors defined in tailwind.config.js
- Toast styles in App.jsx

### Validation Rules:
- Modify validation objects in useForm() calls
- Add custom validators as needed

## Next Steps

1. **Registration Page**: Create user registration flow
2. **Profile Management**: Add profile update functionality  
3. **Two-Factor Authentication**: Implement 2FA support
4. **Social Login**: Add OAuth providers
5. **Session Management**: Add session timeout warnings
6. **Biometric Authentication**: Integrate biometric login

## Troubleshooting

### Common Issues:

1. **Token refresh loop**:
   - Check API endpoint configuration
   - Verify refresh token is valid

2. **Login redirect not working**:
   - Ensure routes are properly configured
   - Check isAuthenticated state

3. **Toast notifications not showing**:
   - Verify Toaster component in App.jsx
   - Check toast.success/error calls

4. **Form validation not working**:
   - Ensure react-hook-form is installed
   - Check validation rules syntax

## Dependencies

- react-hook-form: Form management and validation
- react-router-dom: Routing and navigation
- react-hot-toast: Toast notifications
- @mui/material: Material-UI components (optional)
- zustand: State management
- axios: HTTP client
- tailwindcss: Styling
