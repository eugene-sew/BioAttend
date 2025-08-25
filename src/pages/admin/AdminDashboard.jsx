import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi, attendanceApi, scheduleApi } from '../../api/axios';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [recentActivities, setRecentActivities] = useState([]);

  // Fetch total users
  const { data: usersData } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => userApi.getUsers({ page_size: 1 })
  });

  // Fetch today's attendance statistics
  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceStats } = useQuery({
    queryKey: ['dashboard-attendance', today],
    // Backend expects 'from' and 'to' for date range
    queryFn: () => attendanceApi.getStatistics({
      from: today,
      to: today
    })
  });

  // Fetch active schedules count
  const { data: schedulesData } = useQuery({
    queryKey: ['dashboard-schedules'],
    queryFn: () => scheduleApi.getSchedules({ page_size: 1 })
  });

  // Fetch recent attendance records for activity feed (limit to today to match backend expectations)
  const { data: recentAttendance } = useQuery({
    queryKey: ['dashboard-recent-activity', today],
    queryFn: () => attendanceApi.getRecords({
      from: today,
      to: today,
      page_size: 10,
      ordering: '-created_at'
    })
  });

  // Format recent activities
  useEffect(() => {
    if (recentAttendance?.results) {
      const activities = recentAttendance.results.map(record => ({
        id: record.id,
        type: record.check_out_time ? 'check-out' : 'check-in',
        user: `${record.user?.first_name} ${record.user?.last_name}`,
        time: record.check_out_time || record.check_in_time,
        status: record.status,
        timestamp: record.created_at
      }));
      setRecentActivities(activities);
    }
  }, [recentAttendance]);

  const totalUsers = usersData?.count || 0;
  const todayAttendance = attendanceStats?.average_attendance_rate || 0;
  const totalSchedules = schedulesData?.count || 0;
  const presentToday = attendanceStats?.total_present || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Admin Dashboard
        </h2>
        <p className="text-gray-600">
          Manage users, courses, attendance, and system settings from here.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Users
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {totalUsers}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Schedules
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {totalSchedules}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Today's Attendance
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {todayAttendance}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Present Today
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {presentToday}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              to="/admin/users"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <svg className="h-8 w-8 text-indigo-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="text-sm font-medium text-gray-900 block text-center">User Management</span>
            </Link>
            <Link 
              to="/admin/attendance"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <svg className="h-8 w-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6h12zM5 21h14" />
              </svg>
              <span className="text-sm font-medium text-gray-900 block text-center">Attendance Reports</span>
            </Link>
            <Link 
              to="/admin/courses"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <svg className="h-8 w-8 text-yellow-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm font-medium text-gray-900 block text-center">Course Management</span>
            </Link>
            <Link 
              to="/admin/settings"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
            >
              <svg className="h-8 w-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-900 block text-center">Settings</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity, index) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {index !== recentActivities.slice(0, 5).length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                            ${activity.type === 'check-in' ? 'bg-green-500' : 
                              activity.type === 'check-out' ? 'bg-blue-500' : 
                              'bg-gray-400'}`}
                          >
                            {activity.type === 'check-in' ? (
                              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">{activity.user}</span>{' '}
                              {activity.type === 'check-in' ? 'checked in' : 'checked out'} at{' '}
                              <span className="font-medium">{activity.time}</span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time dateTime={activity.timestamp}>
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-center py-4 text-gray-500">
                  No recent activity
                </li>
              )}
            </ul>
          </div>
          {recentActivities.length > 5 && (
            <div className="mt-6">
              <Link
                to="/admin/attendance"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all activity
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* System Health Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                <span className="h-3 w-3 rounded-full bg-green-400"></span>
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">API Server</p>
              <p className="text-sm text-gray-500">Operational</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                <span className="h-3 w-3 rounded-full bg-green-400"></span>
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Database</p>
              <p className="text-sm text-gray-500">Connected</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                <span className="h-3 w-3 rounded-full bg-green-400"></span>
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Biometric Devices</p>
              <p className="text-sm text-gray-500">All Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
