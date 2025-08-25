# Role-Based Routing & Guarded Layouts

## Overview
This document describes the implementation of role-based routing and guarded layouts for the BioAttend application.

## Components Created

### 1. ProtectedRoute HOC (`src/components/auth/ProtectedRoute.jsx`)
A Higher-Order Component that:
- Checks user authentication status
- Validates user roles against allowed roles
- Redirects unauthorized users to appropriate pages
- Shows loading spinner while user data is being fetched

**Usage:**
```jsx
<ProtectedRoute roles={['ADMIN', 'FACULTY']}>
  <YourComponent />
</ProtectedRoute>
```

### 2. Dashboard Layouts

#### Base Layout (`src/components/layouts/DashboardLayout.jsx`)
- Collapsible sidebar navigation
- User profile display
- Dynamic navigation items
- Logout functionality
- Responsive design

#### Role-Specific Layouts
- **AdminDashboardLayout.jsx**: Admin-specific navigation and features
- **FacultyDashboardLayout.jsx**: Faculty-specific navigation and features  
- **StudentDashboardLayout.jsx**: Student-specific navigation and features

### 3. Dashboard Pages

#### Admin Dashboard (`src/pages/admin/AdminDashboard.jsx`)
- Statistics overview (Users, Courses, Attendance, Devices)
- Quick actions for common tasks
- Admin-specific content

#### Faculty Dashboard (`src/pages/faculty/FacultyDashboard.jsx`)
- Course and student statistics
- Today's schedule
- Faculty-specific quick actions

#### Student Dashboard (`src/pages/student/StudentDashboard.jsx`)
- Course enrollment statistics
- Attendance overview
- Biometric status
- Student-specific content

### 4. Error Pages

#### 403 Forbidden (`src/pages/errors/Forbidden403.jsx`)
- Displayed when user lacks required permissions
- Shows current user role
- Navigation options to return to appropriate dashboard

#### 404 Not Found (`src/pages/errors/NotFound404.jsx`)
- Displayed for non-existent routes
- User-friendly error message
- Navigation options

## Routing Structure

### Route Configuration (`src/routes/index.jsx`)
The main routing configuration with:
- Lazy loading for better performance
- Nested routes for each role
- Protected routes with role validation
- Automatic redirects based on user role

### Route Hierarchy

```
/
├── /login (public)
├── /forgot-password (public)
├── /reset-password (public)
├── /403 (error page)
├── /404 (error page)
├── /admin/* (requires ADMIN role)
│   ├── /admin/dashboard
│   ├── /admin/users
│   ├── /admin/courses
│   ├── /admin/attendance
│   ├── /admin/devices
│   └── /admin/settings
├── /faculty/* (requires FACULTY role)
│   ├── /faculty/dashboard
│   ├── /faculty/courses
│   ├── /faculty/attendance
│   ├── /faculty/reports
│   ├── /faculty/students
│   ├── /faculty/schedule
│   └── /faculty/profile
└── /student/* (requires STUDENT role)
    ├── /student/dashboard
    ├── /student/courses
    ├── /student/attendance
    ├── /student/schedule
    ├── /student/biometric
    └── /student/profile
```

## Authentication Flow

1. **Unauthenticated Users**:
   - Redirected to `/login`
   - Can access public routes (login, password reset)

2. **Authenticated Users**:
   - Automatically redirected to role-specific dashboard
   - Cannot access routes outside their role permissions
   - Unauthorized access attempts redirect to `/403`

3. **Role Validation**:
   - Supports both `role` and `user_type` fields from user object
   - Case-insensitive role matching
   - Multiple roles can be specified for a route

## Features

### Security
- ✅ Role-based access control
- ✅ Protected routes with authentication checks
- ✅ Automatic redirects for unauthorized access
- ✅ Session persistence with Zustand store

### User Experience
- ✅ Loading states during authentication checks
- ✅ Collapsible sidebar for better space utilization
- ✅ Role-specific navigation items
- ✅ Responsive design for all screen sizes
- ✅ User-friendly error pages

### Performance
- ✅ Lazy loading of components
- ✅ Code splitting by role
- ✅ Suspense boundaries for smooth loading

## Usage Examples

### Protecting a Route with Specific Roles
```jsx
<Route
  path="/admin/sensitive-data"
  element={
    <ProtectedRoute roles={['ADMIN']}>
      <SensitiveDataComponent />
    </ProtectedRoute>
  }
/>
```

### Adding New Navigation Items
Edit the respective dashboard layout file and add to the `navigationItems` array:
```jsx
{
  path: '/admin/new-feature',
  label: 'New Feature',
  icon: <YourIcon />
}
```

### Accessing User Role in Components
```jsx
import useAuthStore from '../store/authStore';

const MyComponent = () => {
  const { user } = useAuthStore();
  const userRole = user?.role || user?.user_type;
  
  return <div>User role: {userRole}</div>;
};
```

## Next Steps

1. **Implement actual page components** for placeholder routes
2. **Add role-specific API calls** with proper authorization headers
3. **Implement breadcrumb navigation** for better UX
4. **Add user profile management** pages
5. **Implement notification system** for real-time updates
6. **Add analytics dashboard** for admins
7. **Create settings pages** for each role

## Testing

To test the role-based routing:

1. Login with different user roles
2. Try accessing routes outside your role (should redirect to /403)
3. Logout and try accessing protected routes (should redirect to /login)
4. Check that navigation items match the user's role
5. Verify that the dashboard layout adjusts for different screen sizes

## Notes

- The system supports uppercase role names (ADMIN, FACULTY, STUDENT)
- Role checking is case-insensitive for flexibility
- The sidebar can be collapsed to save screen space
- All routes use lazy loading for optimal performance
- Error boundaries should be added for production use
