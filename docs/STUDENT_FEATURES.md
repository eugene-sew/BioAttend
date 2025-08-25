# Student Features Implementation

## Overview
This document describes the student features implemented for the BioAttend attendance management system.

## Features Implemented

### 1. Attendance Clock-In/Out (`/student/attendance/clock`)

#### Components:
- **CameraCapture Component** (`src/components/attendance/CameraCapture.jsx`)
  - Wrapper around `getUserMedia` API for camera access
  - Captures photo from webcam as JPEG
  - Converts to Base64 format
  - Supports front/back camera switching
  - Real-time preview before capture
  - Retake photo functionality

- **AttendanceClockInOut Page** (`src/pages/student/AttendanceClockInOut.jsx`)
  - Lists today's class schedules
  - Shows real-time attendance status for each class
  - Clock In/Out buttons with appropriate states
  - Time until class starts calculation
  - Visual feedback for success/late/failure states
  - Instructions for students

#### API Endpoints Used:
- `GET /api/schedules/today/` - Fetch today's schedules
- `GET /api/attendance/status/today/` - Get attendance status
- `POST /api/attendance/clock_in/` - Clock in with photo
- `POST /api/attendance/clock_out/` - Clock out with photo

#### Features:
- Real-time status updates (refetch every 30 seconds)
- Photo verification for attendance
- Late attendance detection
- Visual status indicators (Present, Late, Absent, Clocked In)

### 2. Attendance History (`/student/attendance`)

#### Components:
- **AttendanceHistory Page** (`src/pages/student/AttendanceHistory.jsx`)
  - Table view of all attendance records
  - Uses React Query for data fetching
  - Color-coded status badges
  - Shows date, course, clock in/out times, and status

#### API Endpoints Used:
- `GET /api/attendance/` - Fetch attendance history
- `GET /api/attendance/status/{schedule}` - Get specific schedule status

#### Features:
- Sortable table columns
- Status filtering (TODO: Implement filter controls)
- Loading states
- Error handling

### 3. My Schedules (`/student/schedule`)

#### Components:
- **MySchedules Page** (`src/pages/student/MySchedules.jsx`)
  - Two view modes: Week View and List View
  - Shows all enrolled courses and schedules

#### View Modes:

**Week View:**
- Grid layout showing Monday-Friday
- Weekend classes shown separately
- Color-coded schedule blocks
- Room and time information

**List View:**
- Upcoming classes for next 7 days
- Detailed information per class
- Instructor names
- Time and location

#### API Endpoints Used:
- `GET /api/schedules/` - Fetch all student schedules

#### Features:
- Toggle between Week and List views
- Enrolled courses summary
- Sessions per week calculation
- Upcoming schedule filtering

## Technical Implementation

### React Query Setup
- Configured in `src/App.jsx` with QueryClientProvider
- Default options:
  - `staleTime`: 5 minutes
  - `cacheTime`: 10 minutes
  - `refetchOnWindowFocus`: false
  - `retry`: 1
- React Query DevTools included for debugging

### Custom Hooks
Created reusable hooks in `src/hooks/useAttendanceApi.js`:
- `useAttendanceHistory()` - Fetch attendance records
- `useAttendanceStatus()` - Get attendance status
- `useTodaySchedules()` - Get today's schedules
- `useStudentSchedules()` - Get all schedules
- `useClockIn()` - Clock in mutation
- `useClockOut()` - Clock out mutation

### Utility Functions
- `getAttendanceStatusColor()` - Returns Tailwind classes for status badges
- `calculateTimeUntilClass()` - Calculates time until class starts

## Navigation Updates

### Student Dashboard Layout
Updated navigation in `src/components/layouts/StudentDashboardLayout.jsx`:
- Added "Clock In/Out" menu item
- Links to attendance history
- Links to schedule views

### Quick Access
Added Clock In/Out button on Student Dashboard for quick access

### Routes
Updated `src/routes/index.jsx`:
- `/student/attendance` - Attendance History
- `/student/attendance/clock` - Clock In/Out
- `/student/schedule` - My Schedules

## Dependencies Added
- `@tanstack/react-query` - Data fetching and caching
- `@tanstack/react-query-devtools` - Development tools

## Responsive Design
All components are fully responsive:
- Mobile-friendly camera interface
- Responsive tables with horizontal scroll
- Grid layouts that adapt to screen size
- Touch-friendly buttons and controls

## Error Handling
- Camera permission errors
- API error responses
- Network failures
- Loading states
- Empty states

## Security Considerations
- Photo capture for biometric verification
- Base64 encoding for image transmission
- Token-based authentication via axios interceptors
- Automatic token refresh

## Future Enhancements
1. Add filters to attendance history (by date, course, status)
2. Export attendance reports (PDF/CSV)
3. Push notifications for upcoming classes
4. Offline mode with sync
5. Calendar integration
6. Attendance statistics and analytics
7. Face recognition integration
8. QR code backup for attendance
