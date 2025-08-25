# Admin Features Documentation

## Overview
The admin dashboard provides comprehensive management tools for system administrators to oversee users, attendance, and system operations.

## Components

### 1. Admin Dashboard (`AdminDashboard.jsx`)
Main dashboard providing system overview and quick access to admin functions.

**Features:**
- Real-time statistics cards showing:
  - Total users count
  - Active schedules
  - Today's attendance percentage
  - Present users today
- Quick action buttons for common tasks
- Recent activity feed showing latest check-ins/check-outs
- System health status indicators

**Data Sources:**
- User statistics from `userApi.getUsers()`
- Attendance data from `attendanceApi.getStatistics()`
- Schedule information from `scheduleApi.getSchedules()`
- Recent activities from `attendanceApi.getRecords()`

### 2. User Management (`UserManagement.jsx`)
Complete user administration interface for managing system users.

**Features:**
- **User List View:**
  - Paginated table display
  - User avatars with initials
  - Role badges with color coding
  - Active/Inactive status indicators
  
- **Search & Filter:**
  - Real-time search by name/email
  - Filter by role (Admin, Faculty, Student)
  - Pagination controls
  
- **User Operations:**
  - Add new user with modal form
  - Edit existing user details
  - Delete user with confirmation
  - Toggle user active status
  
- **Form Fields:**
  - First Name, Last Name
  - Email address
  - Role selection
  - Department
  - Student ID (for students)
  - Faculty ID (for faculty)
  - Active status toggle

**API Endpoints Used:**
- `GET /users/` - Fetch user list
- `POST /users/` - Create new user
- `PATCH /users/{id}/` - Update user
- `DELETE /users/{id}/` - Delete user

### 3. Attendance Reports (`AttendanceReports.jsx`)
Comprehensive attendance reporting and analytics dashboard.

**Features:**
- **Date Range Selection:**
  - Start and end date pickers
  - Default 30-day range
  
- **Filtering Options:**
  - Department filter
  - Role filter (Student/Faculty)
  - Report type selection (Summary/Detailed/Individual)
  
- **Statistics Cards:**
  - Average attendance percentage
  - Total present count
  - Total absent count
  - Late arrivals count
  
- **Export Functionality:**
  - **CSV Export:** Generate and download attendance data in CSV format
  - **PDF Export:** Create formatted PDF reports with tables and statistics
  
- **Report Types:**
  - **Summary Report:** High-level statistics and trends
  - **Detailed Report:** Individual attendance records with timestamps
  - **Individual Report:** Per-user attendance analysis

**Data Visualization:**
- Statistics cards with icons
- Color-coded status badges
- Tabular data presentation
- Placeholder for charts (ready for integration with charting library)

**API Endpoints Used:**
- `GET /attendance/statistics/` - Fetch attendance statistics
- `GET /attendance/records/` - Get detailed attendance records
- `GET /attendance/export/` - Export attendance data

## Utility Functions (`adminHelpers.js`)

Helper functions for admin features:

- **Date Formatting:**
  - `formatDate()` - Multiple format options
  - `formatDuration()` - Time duration display
  - `getTimeDifference()` - Calculate time differences

- **Data Processing:**
  - `calculateAttendancePercentage()` - Attendance rate calculation
  - `calculateAttendanceStats()` - Aggregate statistics
  - `groupBy()` - Group data by key
  - `multiSort()` - Multi-field sorting

- **UI Helpers:**
  - `getStatusColor()` - Status-based color classes
  - `getRoleColor()` - Role-based color classes
  - `formatUserName()` - User name formatting

- **Export Utilities:**
  - `generateCSV()` - CSV content generation
  - `downloadFile()` - File download trigger

- **Validation:**
  - `validateEmail()` - Email format validation
  - `debounce()` - Input debouncing
  - `generateTempPassword()` - Temporary password generation

## State Management

All components use:
- **React Query** for server state management
- **useState** for local component state
- **useEffect** for side effects
- **Zustand store** for authentication state

## Styling

- Tailwind CSS for all styling
- Responsive design with grid layouts
- Color-coded badges and status indicators
- Hover effects and transitions
- Modal overlays for forms

## Security Considerations

1. **Role-based Access:** Protected routes ensure only admins can access
2. **API Authorization:** Bearer token authentication on all requests
3. **Input Validation:** Client-side validation before API calls
4. **Confirmation Dialogs:** Delete operations require confirmation
5. **Temporary Passwords:** Auto-generated secure passwords for new users

## Future Enhancements

1. **Charts Integration:**
   - Add Recharts or Chart.js for data visualization
   - Attendance trends graphs
   - Department-wise analytics

2. **Bulk Operations:**
   - Bulk user import from CSV
   - Bulk status updates
   - Batch attendance corrections

3. **Advanced Filtering:**
   - Multiple filter combinations
   - Saved filter presets
   - Export filtered results

4. **Real-time Updates:**
   - WebSocket integration for live activity feed
   - Push notifications for critical events
   - Live attendance tracking

5. **Audit Logging:**
   - Track all admin actions
   - Change history for users
   - Activity reports

## Dependencies

- React 19.1.1
- React Query 5.84.2
- React Router DOM 7.8.0
- Axios for API calls
- jsPDF for PDF generation
- jspdf-autotable for PDF tables
- react-hot-toast for notifications
- Tailwind CSS for styling

## Usage

```jsx
// Import components
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AttendanceReports from './pages/admin/AttendanceReports';

// Use in routes
<Route path="/admin/dashboard" element={<AdminDashboard />} />
<Route path="/admin/users" element={<UserManagement />} />
<Route path="/admin/attendance" element={<AttendanceReports />} />
```

## Testing Checklist

- [ ] User CRUD operations
- [ ] Search and filter functionality
- [ ] Pagination
- [ ] CSV export
- [ ] PDF export
- [ ] Date range filtering
- [ ] Role-based filtering
- [ ] Form validation
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Responsive design
- [ ] Accessibility
