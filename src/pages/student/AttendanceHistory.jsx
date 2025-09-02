import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi, userApi } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AttendanceHistory = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { user } = useAuthStore();

  // Fetch student profile to get student ID
  const { data: profileData } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => userApi.getProfile(),
    enabled: !!user
  });

  const studentProfile = profileData?.data?.student_profile;

  // Fetch attendance records using the student report API
  const { data: attendanceData, isLoading, error } = useQuery({
    queryKey: ['student-attendance-records', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      // Use the individual student report endpoint
      const response = await attendanceApi.getStudentReport(studentProfile?.student_id, {
        from: dateRange.startDate,
        to: dateRange.endDate
      });
      
      return response.data?.attendance_records || [];
    },
    enabled: !!studentProfile?.student_id
  });

  // Calculate statistics from the student report data
  const { data: reportData } = useQuery({
    queryKey: ['student-report-data', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await attendanceApi.getStudentReport(studentProfile?.student_id, {
        from: dateRange.startDate,
        to: dateRange.endDate
      });
      return response.data;
    },
    enabled: !!studentProfile?.student_id
  });

  // Extract statistics from report data
  const statsData = useMemo(() => {
    if (!reportData?.statistics) return {};
    
    const stats = reportData.statistics;
    return {
      total_present: stats.total_present || 0,
      total_late: stats.total_late || 0,
      total_absent: stats.total_absent || 0,
      attendance_rate: stats.attendance_rate || 0
    };
  }, [reportData]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (status) => {
    const configs = {
      PRESENT: {
        icon: CheckCircleIcon,
        text: 'Present',
        className: 'bg-green-100 text-green-800'
      },
      LATE: {
        icon: ExclamationTriangleIcon,
        text: 'Late',
        className: 'bg-yellow-100 text-yellow-800'
      },
      ABSENT: {
        icon: XCircleIcon,
        text: 'Absent',
        className: 'bg-red-100 text-red-800'
      }
    };

    const config = configs[status] || configs.ABSENT;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          Error loading attendance records: {error.message}
        </div>
      </div>
    );
  }

  const records = Array.isArray(attendanceData) ? attendanceData : [];
  const stats = statsData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="mt-2 text-sm text-gray-700">
            View your attendance history and statistics
          </p>
          {studentProfile?.group && (
            <p className="text-sm text-gray-600">
              Course: <span className="font-medium">{studentProfile.group.name} ({studentProfile.group.code})</span>
            </p>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <div className="mt-1 relative">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <CalendarIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <div className="mt-1 relative">
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <CalendarIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Days Present</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total_present || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Late Arrivals</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total_late || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Days Absent</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total_absent || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Attendance Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(stats.attendance_rate || 0)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Attendance Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {record.time_in || record.check_in_time || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {record.time_out || record.check_out_time || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.is_manual_override ? 'Manual' : 'Automatic'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {records.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
              <p className="mt-1 text-sm text-gray-500">
                No attendance records found for the selected period.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
