// Components barrel exports
// Export all reusable UI components from this file

// Common Components
export { default as ErrorBoundary } from './common/ErrorBoundary';
export { default as Loader, SkeletonLoader, CardSkeletonLoader, TableSkeletonLoader } from './common/Loader';
export { default as LoadingSpinner } from './common/LoadingSpinner';

// UI Components
export { default as Button } from './ui/Button';
export { default as Card } from './ui/Card';
export { default as Modal } from './ui/Modal';
export { default as Input, Textarea, Select } from './ui/Input';
export { default as Badge } from './ui/Badge';
export { default as Avatar } from './ui/Avatar';
export { default as Dropdown } from './ui/Dropdown';
export { default as Table } from './ui/Table';
export { default as Toast } from './ui/Toast';
export { default as GlobalModal } from './ui/GlobalModal';
export { default as ThemeToggle } from './ui/ThemeToggle';

// Layout Components
export { default as AdminDashboardLayout } from './layouts/AdminDashboardLayout';
export { default as FacultyDashboardLayout } from './layouts/FacultyDashboardLayout';
export { default as StudentDashboardLayout } from './layouts/StudentDashboardLayout';
export { default as DashboardLayout } from './layouts/DashboardLayout';

// Auth Components
export { default as ProtectedRoute } from './auth/ProtectedRoute';

// Attendance Components
export { default as CameraCapture } from './attendance/CameraCapture';
export { default as ClassAttendanceView } from './attendance/ClassAttendanceView';
export { default as RealTimeAttendanceTable } from './attendance/RealTimeAttendanceTable';

// Schedule Components
export { default as ScheduleForm } from './schedules/ScheduleForm';
export { default as ScheduleList } from './schedules/ScheduleList';
