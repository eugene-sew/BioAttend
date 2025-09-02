import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userApi, attendanceApi } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  AcademicCapIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Fetch student profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => userApi.getProfile(),
    enabled: !!user
  });

  // Fetch student attendance stats
  const { data: attendanceStats } = useQuery({
    queryKey: ['student-attendance-stats'],
    queryFn: () => attendanceApi.getStudentAttendance({
      from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    }),
    enabled: !!user
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const studentProfile = profileData?.data?.student_profile;
  const stats = attendanceStats?.data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Section with Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.first_name || 'Student'}!
            </h2>
            {studentProfile && (
              <div className="space-y-1 text-sm text-gray-600">
                <p>Student ID: <span className="font-medium">{studentProfile.student_id}</span></p>
                {studentProfile.group && (
                  <p>Course: <span className="font-medium">{studentProfile.group.name} ({studentProfile.group.code})</span></p>
                )}
                <p>Status: <span className={`font-medium ${studentProfile.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                  {studentProfile.status}
                </span></p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/student/attendance/clock')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <ClockIcon className="w-5 h-5" />
            Clock In/Out
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Enrolled Courses
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {studentProfile?.group ? 1 : 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Attendance Rate
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {Math.round(stats.attendance_rate || 0)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Days Present
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stats.total_present || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Late Arrivals
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stats.total_late || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Course Information */}
      {studentProfile?.group && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <UserGroupIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">My Course</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Course Name</dt>
                <dd className="text-sm text-gray-900 font-medium">{studentProfile.group.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Course Code</dt>
                <dd className="text-sm text-gray-900 font-medium">{studentProfile.group.code}</dd>
              </div>
              {studentProfile.group.academic_year && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Academic Year</dt>
                  <dd className="text-sm text-gray-900">{studentProfile.group.academic_year}</dd>
                </div>
              )}
              {studentProfile.group.semester && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Semester</dt>
                  <dd className="text-sm text-gray-900">{studentProfile.group.semester}</dd>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Attendance</h3>
          </div>
          <p className="text-gray-600 mb-4">View your attendance history and clock in/out</p>
          <button
            onClick={() => navigate('/student/attendance')}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            View Attendance
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Reports</h3>
          </div>
          <p className="text-gray-600 mb-4">View detailed attendance reports and statistics</p>
          <button
            onClick={() => navigate('/student/reports')}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            View Reports
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <UserGroupIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Biometric</h3>
          </div>
          <p className="text-gray-600 mb-4">Manage your biometric enrollment status</p>
          <button
            onClick={() => navigate('/student/biometric')}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            Biometric Status
          </button>
        </div>
      </div>

      {/* No Course Warning */}
      {!studentProfile?.group && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Course Assigned</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You are not currently enrolled in any course. Please contact your administrator to be assigned to a course.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
