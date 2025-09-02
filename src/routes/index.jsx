import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import useAuthStore from '../store/authStore';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const PasswordResetRequest = lazy(
  () => import('../pages/auth/PasswordResetRequest')
);
const PasswordResetConfirm = lazy(
  () => import('../pages/auth/PasswordResetConfirm')
);
const Forbidden403 = lazy(() => import('../pages/errors/Forbidden403'));
const NotFound404 = lazy(() => import('../pages/errors/NotFound404'));

// Admin pages
const AdminDashboardLayout = lazy(
  () => import('../components/layouts/AdminDashboardLayout')
);
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const AttendanceReports = lazy(
  () => import('../pages/admin/AttendanceReports')
);
const GroupManagement = lazy(() => import('../pages/admin/GroupManagement'));
const Enrollments = lazy(() => import('../pages/admin/Enrollments'));

// Faculty pages
const FacultyDashboardLayout = lazy(
  () => import('../components/layouts/FacultyDashboardLayout')
);
const FacultyDashboard = lazy(
  () => import('../pages/faculty/FacultyDashboard')
);
const FacultySchedules = lazy(
  () => import('../pages/faculty/FacultySchedules')
);
const FacultyAttendance = lazy(
  () => import('../pages/faculty/FacultyAttendance')
);
const FacultyStudents = lazy(() => import('../pages/faculty/FacultyStudents'));
const FacultyMyGroups = lazy(() => import('../pages/faculty/MyGroups'));
const FacultyCourses = lazy(() => import('../pages/faculty/Courses'));
const FacultyAttendanceReports = lazy(() => import('../pages/faculty/AttendanceReports'));
const DetailedAttendance = lazy(() => import('../pages/faculty/DetailedAttendance'));
const FacultyProfile = lazy(() => import('../pages/faculty/Profile'));

// Student pages
const StudentDashboardLayout = lazy(
  () => import('../components/layouts/StudentDashboardLayout')
);
const StudentDashboard = lazy(
  () => import('../pages/student/StudentDashboard')
);
const AttendanceClockInOut = lazy(
  () => import('../pages/student/AttendanceClockInOut')
);
const AttendanceHistory = lazy(
  () => import('../pages/student/AttendanceHistory')
);
const MySchedules = lazy(() => import('../pages/student/MySchedules'));
const StudentMyGroups = lazy(() => import('../pages/student/MyGroups'));
const BiometricStatus = lazy(() => import('../pages/student/BiometricStatus'));
const StudentAttendanceReports = lazy(() => import('../pages/student/AttendanceReports'));
const StudentProfile = lazy(() => import('../pages/student/Profile'));

// UI Showcase (Development only)
const UIShowcase = lazy(() => import('../pages/UIShowcase'));
// Reports
const AttendanceReport = lazy(
  () => import('../pages/reports/AttendanceReport')
);

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Main routing component
const AppRoutes = () => {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect to appropriate dashboard based on user role
  const getDashboardRoute = () => {
    if (!isAuthenticated || !user) return '/login';
    const role = (user.role || user.user_type || '').toLowerCase();
    return `/${role}/dashboard`;
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<PasswordResetRequest />} />
        <Route path="/reset-password" element={<PasswordResetConfirm />} />

        {/* UI Showcase (Development) */}
        <Route path="/ui-showcase" element={<UIShowcase />} />

        {/* Error Pages */}
        <Route path="/403" element={<Forbidden403 />} />
        <Route path="/404" element={<NotFound404 />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          {/* Admin routes */}
          <Route path="users" element={<UserManagement />} />
          <Route path="attendance" element={<AttendanceReports />} />
          <Route path="courses" element={<GroupManagement />} />
          <Route path="enrollments" element={<Enrollments />} />
        </Route>

        {/* Faculty Routes */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute roles={['FACULTY']}>
              <FacultyDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/faculty/dashboard" replace />} />
          <Route path="dashboard" element={<FacultyDashboard />} />
          {/* Faculty routes */}
          <Route path="courses" element={<FacultyCourses />} />
          <Route path="attendance" element={<FacultyAttendance />} />
          <Route path="attendance/:scheduleId" element={<DetailedAttendance />} />
          <Route path="reports" element={<FacultyAttendanceReports />} />
          <Route path="students" element={<FacultyStudents />} />
          <Route path="my-groups" element={<FacultyMyGroups />} />
          <Route path="schedules" element={<FacultySchedules />} />
          <Route path="profile" element={<FacultyProfile />} />
        </Route>

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <StudentDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          {/* Student routes */}
          <Route path="attendance" element={<AttendanceHistory />} />
          <Route path="attendance/clock" element={<AttendanceClockInOut />} />
          <Route path="reports" element={<StudentAttendanceReports />} />
          <Route path="schedule" element={<MySchedules />} />
          <Route path="my-groups" element={<StudentMyGroups />} />
          <Route path="biometric" element={<BiometricStatus />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* Default redirect based on authentication */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all - 404 */}
        <Route path="*" element={<NotFound404 />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
