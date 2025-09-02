import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { attendanceApi } from '../../api/axios';
import usePusher from '../../hooks/usePusher';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const ClassAttendanceView = ({ scheduleId, scheduleTitle, date }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  // Fetch attendance data
  const {
    data: attendanceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['schedule-attendance', scheduleId, date],
    queryFn: () => attendanceApi.getScheduleAttendance(scheduleId, date),
    enabled: !!scheduleId,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Manual clock-in mutation
  const manualClockInMutation = useMutation({
    mutationFn: ({ studentId }) =>
      attendanceApi.manualClockIn(scheduleId, studentId, date),
    onSuccess: (data) => {
      toast.success(`${data.attendance.student_name} has been clocked in`);
      // Invalidate and refetch attendance data
      queryClient.invalidateQueries(['schedule-attendance', scheduleId, date]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to clock in student');
    },
  });

  // Real-time updates via Pusher
  const handleAttendanceUpdate = useCallback(
    (data) => {
      // Update the query cache with new data
      queryClient.setQueryData(
        ['schedule-attendance', scheduleId, date],
        (oldData) => {
          if (!oldData) return oldData;

          const updatedAttendance = oldData.attendance.map((record) => {
            if (record.student_id === data.student_id) {
              return {
                ...record,
                status: data.status,
                check_in_time: data.check_in_time,
                is_manual_override: data.type === 'manual_clock_in',
              };
            }
            return record;
          });

          return {
            ...oldData,
            attendance: updatedAttendance,
            stats: {
              ...oldData.stats,
              present: updatedAttendance.filter((r) => r.status === 'PRESENT')
                .length,
              late: updatedAttendance.filter((r) => r.status === 'LATE').length,
              absent: updatedAttendance.filter((r) => r.status === 'ABSENT')
                .length,
            },
          };
        }
      );

      // Show notification for automatic clock-ins
      if (data.type === 'student_clock_in') {
        toast.success(`${data.student_name} clocked in automatically`, {
          icon: '📸',
          duration: 3000,
        });
      }
    },
    [queryClient, scheduleId, date]
  );

  // Subscribe to Pusher notifications
  usePusher(
    `faculty-schedule-${scheduleId}`,
    'attendance-notification',
    handleAttendanceUpdate
  );

  const attendance = attendanceData?.attendance || [];
  const schedule = attendanceData?.schedule || {};
  const stats = attendanceData?.stats || {
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
  };

  // Filter records
  const filteredRecords = attendance.filter((record) => {
    const matchesSearch =
      !searchTerm ||
      record.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || record.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const configs = {
      PRESENT: {
        icon: CheckCircleIcon,
        text: 'Present',
        className: 'bg-green-100 text-green-800',
      },
      LATE: {
        icon: ExclamationTriangleIcon,
        text: 'Late',
        className: 'bg-yellow-100 text-yellow-800',
      },
      ABSENT: {
        icon: XCircleIcon,
        text: 'Absent',
        className: 'bg-red-100 text-red-800',
      },
    };

    const config = configs[status] || configs.ABSENT;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
      >
        <Icon className="mr-1 h-3 w-3" />
        {config.text}
      </span>
    );
  };

  const handleManualClockIn = (studentId, studentName) => {
    if (window.confirm(`Clock in ${studentName} manually?`)) {
      manualClockInMutation.mutate({ studentId });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex h-32 items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="text-center text-red-600">
          Error loading attendance data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Header with metrics */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {scheduleTitle || schedule.title}
            </h3>
            <p className="text-sm text-gray-500">
              {schedule.start_time} - {schedule.end_time} • {schedule.date}
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center text-green-600">
              <CheckCircleIcon className="mr-1 h-4 w-4" />
              Present: {stats.present}
            </span>
            <span className="flex items-center text-yellow-600">
              <ExclamationTriangleIcon className="mr-1 h-4 w-4" />
              Late: {stats.late}
            </span>
            <span className="flex items-center text-red-600">
              <XCircleIcon className="mr-1 h-4 w-4" />
              Absent: {stats.absent}
            </span>
            <span className="text-gray-600">Total: {stats.total}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Check In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredRecords.map((record, index) => (
              <tr key={record.student_id || index} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500">
                        <span className="text-xs font-medium text-white">
                          {record.student_name?.[0] || 'S'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {record.student_name || 'Unknown Student'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.student_id || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {record.check_in_time || 'Not clocked in'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {getStatusBadge(record.status)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {record.is_manual_override ? 'Manual' : 'Automatic'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  {record.status === 'ABSENT' && (
                    <button
                      onClick={() =>
                        handleManualClockIn(
                          record.student_id,
                          record.student_name
                        )
                      }
                      disabled={manualClockInMutation.isLoading}
                      className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      <ClockIcon className="mr-1 h-3 w-3" />
                      Clock In
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRecords.length === 0 && (
          <div className="py-12 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No attendance records
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {attendance.length === 0
                ? 'No attendance data found for this class session.'
                : 'No records match your current filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassAttendanceView;
