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
      // Handle manual clock-in requests
      if (data.type === 'manual_clock_in_request') {
        const message = `${data.student_name} is requesting manual clock-in`;
        const reason = data.reason ? ` (Reason: ${data.reason})` : '';
        
        toast((t) => (
          <div className="flex flex-col space-y-2">
            <div className="font-medium">Manual Clock-in Request</div>
            <div className="text-sm text-gray-600">
              {message}{reason}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  handleManualClockIn(data.student_id, data.student_name);
                  toast.dismiss(t.id);
                }}
                className="rounded bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="rounded bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        ), {
          duration: 10000,
          icon: '🙋‍♂️',
        });
        
        return; // Don't process further for manual requests
      }

      // Update the query cache with new data for actual clock-ins
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
    <div className="rounded-lg bg-white shadow mx-4 md:mx-0">
      {/* Header with metrics */}
      <div className="border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {scheduleTitle || schedule.title}
            </h3>
            <p className="text-sm text-gray-500">
              {schedule.start_time} - {schedule.end_time} • {schedule.date}
            </p>
          </div>
          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 lg:gap-4 text-sm">
            <span className="flex items-center text-green-600">
              <CheckCircleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
              Present: {stats.present}
            </span>
            <span className="flex items-center text-yellow-600">
              <ExclamationTriangleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
              Late: {stats.late}
            </span>
            <span className="flex items-center text-red-600">
              <XCircleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
              Absent: {stats.absent}
            </span>
            <span className="text-gray-600">Total: {stats.total}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {filteredRecords.map((record, index) => (
          <div key={record.student_id || index} className="p-4 hover:bg-gray-50">
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500">
                  <span className="text-sm font-medium text-white">
                    {record.student_name?.[0] || 'S'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {record.student_name || 'Unknown Student'}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {record.student_id || 'N/A'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(record.status)}
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Check In:</span>
                    <span className="text-gray-900">
                      {record.check_in_time || 'Not clocked in'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Method:</span>
                    <span className="text-gray-900">
                      {record.is_manual_override ? 'Manual' : 'Automatic'}
                    </span>
                  </div>
                </div>
                {record.status === 'ABSENT' && (
                  <div className="mt-3">
                    <button
                      onClick={() =>
                        handleManualClockIn(
                          record.student_id,
                          record.student_name
                        )
                      }
                      disabled={manualClockInMutation.isLoading}
                      className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      <ClockIcon className="mr-2 h-4 w-4" />
                      Clock In Manually
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
