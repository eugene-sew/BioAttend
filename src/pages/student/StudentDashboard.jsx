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
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Fetch student profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => userApi.getProfile(),
    enabled: !!user,
  });

  // Fetch student attendance stats
  const { data: attendanceStats } = useQuery({
    queryKey: ['student-attendance-stats'],
    queryFn: () =>
      attendanceApi.getStudentAttendance({
        from: new Date(new Date().setDate(new Date().getDate() - 30))
          .toISOString()
          .split('T')[0],
        to: new Date().toISOString().split('T')[0],
      }),
    enabled: !!user,
  });

  if (profileLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const studentProfile = profileData?.data?.student_profile;
  const stats = attendanceStats?.data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Section with Quick Actions */}
      <div className="rounded-lg bg-white p-4 shadow md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Welcome back, {user?.first_name || 'Student'}!
            </h2>
            {studentProfile && (
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  Student ID:{' '}
                  <span className="font-medium">
                    {studentProfile.student_id}
                  </span>
                </p>
                {studentProfile.group && (
                  <p>
                    Course:{' '}
                    <span className="font-medium">
                      {studentProfile.group.name} ({studentProfile.group.code})
                    </span>
                  </p>
                )}
                <p>
                  Status:{' '}
                  <span
                    className={`font-medium ${studentProfile.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {studentProfile.status}
                  </span>
                </p>
              </div>
            )}
          </div>
          <div className="sm:pt-1">
            <button
              onClick={() => navigate('/student/attendance/clock')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
            >
              <ClockIcon className="h-5 w-5" />
              Clock In/Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-indigo-500 p-3">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Enrolled Courses
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {studentProfile?.group ? 1 : 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-green-500 p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Attendance Rate
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {Math.round(stats.attendance_rate || 0)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-blue-500 p-3">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Days Present
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stats.total_present || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-yellow-500 p-3">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
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
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center">
            <UserGroupIcon className="mr-2 h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">My Course</h3>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Course Name
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {studentProfile.group.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Course Code
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {studentProfile.group.code}
                </dd>
              </div>
              {studentProfile.group.academic_year && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Academic Year
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {studentProfile.group.academic_year}
                  </dd>
                </div>
              )}
              {studentProfile.group.semester && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Semester
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {studentProfile.group.semester}
                  </dd>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center">
            <ClockIcon className="mr-2 h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-medium text-gray-900">Attendance</h3>
          </div>
          <p className="mb-4 text-gray-600">
            View your attendance history and clock in/out
          </p>
          <button
            onClick={() => navigate('/student/attendance')}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
          >
            View Attendance
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center">
            <UserGroupIcon className="mr-2 h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">Biometric</h3>
          </div>
          <p className="mb-4 text-gray-600">
            Manage your biometric enrollment status
          </p>
          <button
            onClick={() => navigate('/student/biometric')}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
          >
            Biometric Status
          </button>
        </div>
      </div>

      {/* No Course Warning */}
      {!studentProfile?.group && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Course Assigned
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You are not currently enrolled in any course. Please contact
                  your administrator to be assigned to a course.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
