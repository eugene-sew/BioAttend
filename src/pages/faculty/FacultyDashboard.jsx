import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facultyApi, userApi } from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTodaySchedules } from '../../hooks/useAttendanceApi';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  // My Courses (assigned groups)
  const {
    data: groups = [],
    isLoading: groupsLoading,
    isError: groupsError,
    error: groupsErrObj,
  } = useQuery({
    queryKey: ['faculty', 'my-groups'],
    queryFn: facultyApi.getMyGroups,
    retry: false,
  });

  // Total Students under this faculty (across assigned groups)
  const {
    data: studentsData,
    isLoading: studentsLoading,
    isError: studentsError,
    error: studentsErrObj,
  } = useQuery({
    queryKey: ['faculty', 'students', 'all'],
    // userApi.getFacultyStudents returns AxiosResponse; map to data
    queryFn: () => userApi.getFacultyStudents({}).then((r) => r?.data),
    retry: false,
  });

  const studentCount = useMemo(() => {
    const d = studentsData;
    if (!d) return 0;
    if (Array.isArray(d)) return d.length;
    if (typeof d?.count === 'number') return d.count;
    if (Array.isArray(d?.results)) return d.results.length;
    return 0;
  }, [studentsData]);

  // Today's schedules for this faculty (scoped by backend to current user)
  const {
    data: todaySchedules = [],
    isLoading: todayLoading,
    isError: todayError,
    error: todayErrObj,
  } = useTodaySchedules();

  const classesTodayCount = Array.isArray(todaySchedules) ? todaySchedules.length : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Faculty Dashboard
        </h2>
        <p className="text-gray-600">
          Manage your courses, take attendance, and view student progress.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  My Courses
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {groupsLoading ? '—' : groupsError ? '!' : Array.isArray(groups) ? groups.length : 0}
                </dd>
                {(groupsLoading || groupsError) && (
                  <dd className="mt-1 text-xs text-gray-500">
                    {groupsLoading ? 'Loading…' : 'Failed to load'}
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Students
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {studentsLoading ? '—' : studentsError ? '!' : studentCount}
                </dd>
                {(studentsLoading || studentsError) && (
                  <dd className="mt-1 text-xs text-gray-500">
                    {studentsLoading ? 'Loading…' : 'Failed to load'}
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Classes Today
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {todayLoading ? '—' : todayError ? '!' : classesTodayCount}
                </dd>
                {(todayLoading || todayError) && (
                  <dd className="mt-1 text-xs text-gray-500">
                    {todayLoading ? 'Loading…' : 'Failed to load'}
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Classes</h3>
        {todayLoading ? (
          <div className="flex h-40 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : todayError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load today's classes
          </div>
        ) : !todaySchedules || todaySchedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2">No classes scheduled for today</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {todaySchedules.map((cls) => {
              const title = cls?.title || cls?.name || 'Class';
              const groupName = cls?.group?.name || cls?.assigned_group?.name || cls?.group_name || '—';
              const start = cls?.start_time ? new Date(cls.start_time) : null;
              const end = cls?.end_time ? new Date(cls.end_time) : null;
              const timeLabel = start && end
                ? `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : '—';
              return (
                <li key={cls.id || `${title}-${timeLabel}`} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{title}</div>
                    <div className="text-xs text-gray-500">{groupName}</div>
                    <div className="text-xs text-gray-500">{timeLabel}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/faculty/attendance')}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      Take Attendance
                    </button>
                    <button
                      onClick={() => navigate('/faculty/schedules')}
                      className="rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      View
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/faculty/attendance')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-8 w-8 text-indigo-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Take Attendance</span>
          </button>
          <button 
            onClick={() => navigate('/faculty/schedules')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-8 w-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Manage Schedules</span>
          </button>
          <button 
            onClick={() => navigate('/faculty/reports')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-8 w-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6h12zM5 21h14" />
            </svg>
            <span className="text-sm font-medium text-gray-900">View Reports</span>
          </button>
          <button 
            onClick={() => navigate('/faculty/students')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-8 w-8 text-yellow-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Student List</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
