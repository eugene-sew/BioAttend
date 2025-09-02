/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceApi, scheduleApi, userApi } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserPlusIcon,
  ArrowLeftIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const DetailedAttendance = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [manualStatus, setManualStatus] = useState('PRESENT');
  const [manualReason, setManualReason] = useState('');

  // Fetch schedule details
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => scheduleApi.getSchedule(scheduleId),
    enabled: !!scheduleId,
  });

  const schedule = scheduleData?.data;

  // Fetch attendance records for this schedule
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['schedule-attendance', scheduleId],
    queryFn: async () => {
      if (!schedule?.group?.id) return [];

      const today = new Date().toISOString().split('T')[0];
      const response = await attendanceApi.getRecords({
        from: today,
        to: today,
        group: schedule.group.id,
      });
      return response.data || [];
    },
    enabled: !!schedule?.group?.id,
  });

  // Fetch students in this group for manual attendance
  const { data: studentsData } = useQuery({
    queryKey: ['group-students', schedule?.group?.id],
    queryFn: () => userApi.getFacultyStudents({ group: schedule.group.id }),
    enabled: !!schedule?.group?.id,
  });

  const attendanceRecords = Array.isArray(attendanceData) ? attendanceData : [];
  const students = studentsData?.results || [];

  // Calculate metrics
  const metrics = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter((r) => r.status === 'PRESENT').length,
    late: attendanceRecords.filter((r) => r.status === 'LATE').length,
    absent: attendanceRecords.filter((r) => r.status === 'ABSENT').length,
    attendanceRate:
      attendanceRecords.length > 0
        ? Math.round(
            (attendanceRecords.filter(
              (r) => r.status === 'PRESENT' || r.status === 'LATE'
            ).length /
              attendanceRecords.length) *
              100
          )
        : 0,
  };

  // Manual attendance mutation
  const manualAttendanceMutation = useMutation({
    mutationFn: async (data) => {
      const response = await attendanceApi.manualAttendance({
        student_id: data.studentId,
        schedule_id: scheduleId,
        status: data.status,
        reason: data.reason,
        is_manual_override: true,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Manual attendance recorded successfully');
      setShowManualModal(false);
      setSelectedStudent('');
      setManualReason('');
      queryClient.invalidateQueries(['schedule-attendance', scheduleId]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to record manual attendance'
      );
    },
  });

  const handleManualAttendance = () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    manualAttendanceMutation.mutate({
      studentId: selectedStudent,
      status: manualStatus,
      reason: manualReason || 'Manual entry by faculty',
    });
  };

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

  if (scheduleLoading || attendanceLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Schedule not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/faculty/attendance')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {schedule.group?.name || 'Class Attendance'}
            </h1>
            <p className="text-sm text-gray-500">
              {schedule.start_time} - {schedule.end_time} •{' '}
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Manual Attendance
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Total Students
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Present
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.present}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Late
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.late}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Absent
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.absent}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-400">
                  <span className="text-xs font-bold text-white">%</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Attendance Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.attendanceRate}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Attendance Records
          </h3>
        </div>

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
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Method
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {attendanceRecords.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-gray-50">
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
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4 text-gray-400" />
                      {record.check_in_time || 'N/A'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4 text-gray-400" />
                      {record.check_out_time || 'N/A'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {record.is_manual_override ? 'Manual' : 'Automatic'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {attendanceRecords.length === 0 && (
            <div className="py-12 text-center">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No attendance records
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No attendance data found for this class session.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowManualModal(false)}
            />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <UserPlusIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Manual Attendance Entry
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Student
                        </label>
                        <select
                          value={selectedStudent}
                          onChange={(e) => setSelectedStudent(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select a student...</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.student_id}>
                              {student.full_name} ({student.student_id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          value={manualStatus}
                          onChange={(e) => setManualStatus(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="PRESENT">Present</option>
                          <option value="LATE">Late</option>
                          <option value="ABSENT">Absent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Reason (Optional)
                        </label>
                        <textarea
                          value={manualReason}
                          onChange={(e) => setManualReason(e.target.value)}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Enter reason for manual entry..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleManualAttendance}
                  disabled={manualAttendanceMutation.isLoading}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {manualAttendanceMutation.isLoading
                    ? 'Recording...'
                    : 'Record Attendance'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedAttendance;
