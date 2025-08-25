import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import usePusher from '../../hooks/usePusher';
import { attendanceApi, scheduleApi, userApi } from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const ClassAttendanceView = ({ scheduleId, scheduleTitle }) => {
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pusher connection for real-time updates
  const { isConnected, connectionType, lastEvent } = usePusher(scheduleId, {
    onEvent: handleRealTimeEvent,
    onConnect: (type) => {
      console.log(`Connected via ${type}`);
      toast.success(`Real-time updates connected via ${type}`);
    },
    onDisconnect: (type) => {
      console.log(`Disconnected from ${type}`);
      toast.error('Real-time updates disconnected');
    },
    onError: (error) => {
      console.error('Pusher error:', error);
    },
  });

  // Handle incoming Pusher events
  function handleRealTimeEvent(message) {
    console.log('Received message:', message);

    switch (message.type) {
      case 'attendance_update':
        updateAttendanceRecord(message.payload);
        break;
      case 'student_checked_in':
        handleStudentCheckIn(message.payload);
        break;
      case 'student_checked_out':
        handleStudentCheckOut(message.payload);
        break;
      case 'status_change':
        handleStatusChange(message.payload);
        break;
      case 'manual_override':
        handleManualOverride(message.payload);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  // Update attendance record
  const updateAttendanceRecord = (payload) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [payload.student_id]: {
        ...prev[payload.student_id],
        ...payload,
      },
    }));
  };

  // Handle student check-in
  const handleStudentCheckIn = (payload) => {
    const { student_id, check_in_time, status } = payload;
    setAttendanceRecords((prev) => ({
      ...prev,
      [student_id]: {
        ...prev[student_id],
        status: status || 'present',
        check_in_time,
        is_present: true,
      },
    }));
    toast.success(`${payload.student_name || 'Student'} checked in`);
  };

  // Handle student check-out
  const handleStudentCheckOut = (payload) => {
    const { student_id, check_out_time } = payload;
    setAttendanceRecords((prev) => ({
      ...prev,
      [student_id]: {
        ...prev[student_id],
        check_out_time,
      },
    }));
    toast.info(`${payload.student_name || 'Student'} checked out`);
  };

  // Handle status change
  const handleStatusChange = (payload) => {
    const { student_id, status, reason } = payload;
    setAttendanceRecords((prev) => ({
      ...prev,
      [student_id]: {
        ...prev[student_id],
        status,
        override_reason: reason,
      },
    }));
  };

  // Handle manual override
  const handleManualOverride = (payload) => {
    const { student_id, status, reason, updated_by } = payload;
    setAttendanceRecords((prev) => ({
      ...prev,
      [student_id]: {
        ...prev[student_id],
        status,
        override_reason: reason,
        manual_override: true,
        updated_by,
      },
    }));
    toast.success(
      `Attendance updated for ${payload.student_name || 'student'}`
    );
  };

  // Fetch initial data
  useEffect(() => {
    fetchAttendanceData();
  }, [scheduleId]);

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      // 1) Load schedule to find assigned group
      const schedRes = await scheduleApi.getSchedule(scheduleId);
      const groupId = schedRes?.data?.assigned_group_detail?.id;

      // 2) Fetch students for this group via faculty endpoint
      let studentsData = [];
      if (groupId) {
        const studentsResponse = await userApi.getFacultyStudents({
          group: groupId,
        });
        studentsData =
          studentsResponse.data?.results || studentsResponse.data || [];
      }

      setStudents(studentsData);

      // Initialize attendance records
      const records = {};
      studentsData.forEach((student) => {
        const key = student.user_id || student.id;
        records[key] = {
          status: 'absent',
          check_in_time: null,
          check_out_time: null,
          is_present: false,
          manual_override: false,
          override_reason: '',
        };
      });
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  // Open override modal
  const openOverrideModal = (student) => {
    setSelectedStudent(student);
    setOverrideReason('');
    setShowOverrideModal(true);
  };

  // Close override modal
  const closeOverrideModal = () => {
    setSelectedStudent(null);
    setOverrideReason('');
    setShowOverrideModal(false);
  };

  // Submit manual override
  const submitOverride = async (status) => {
    if (!selectedStudent) return;

    try {
      const response = await attendanceApi.updateRecord(selectedStudent.id, {
        status,
        manual_override: true,
        notes: overrideReason,
        schedule_id: scheduleId,
      });

      // Update local state
      handleManualOverride({
        student_id: selectedStudent.user_id || selectedStudent.id,
        student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        status,
        reason: overrideReason,
      });

      closeOverrideModal();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter students based on search and status
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      student.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const studentRecord = attendanceRecords[student.user_id || student.id];
    const matchesStatus =
      filterStatus === 'all' ||
      (studentRecord && studentRecord.status === filterStatus);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: students.length,
    present: Object.values(attendanceRecords).filter(
      (r) => r.status === 'present'
    ).length,
    late: Object.values(attendanceRecords).filter((r) => r.status === 'late')
      .length,
    absent: Object.values(attendanceRecords).filter(
      (r) => r.status === 'absent'
    ).length,
    excused: Object.values(attendanceRecords).filter(
      (r) => r.status === 'excused'
    ).length,
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {scheduleTitle || 'Class Attendance'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-1 rounded-full px-3 py-1 text-sm ${
                isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'animate-pulse bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <span>
                {isConnected ? `Live (${connectionType})` : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-5 gap-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-sm text-green-600">Present</p>
            <p className="text-2xl font-bold text-green-900">{stats.present}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3">
            <p className="text-sm text-yellow-600">Late</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-600">Absent</p>
            <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-600">Excused</p>
            <p className="text-2xl font-bold text-blue-900">{stats.excused}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search Student
            </label>
            <input
              type="text"
              placeholder="Name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              <option value="all">All Students</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAttendanceData}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Notes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredStudents.map((student) => {
                const record =
                  attendanceRecords[student.user_id || student.id] || {};
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500">
                            <span className="font-medium text-white">
                              {student.first_name[0]}
                              {student.last_name[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {student.employee_id || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                          record.status || 'absent'
                        )}`}
                      >
                        {record.status || 'absent'}
                        {record.manual_override && (
                          <svg
                            className="ml-1 h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {record.check_in_time
                        ? format(new Date(record.check_in_time), 'h:mm a')
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {record.check_out_time
                        ? format(new Date(record.check_out_time), 'h:mm a')
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {record.override_reason || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openOverrideModal(student)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal */}
      {showOverrideModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Manual Attendance Override
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Update attendance for {selectedStudent.first_name}{' '}
              {selectedStudent.last_name}
            </p>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reason for Override
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Enter reason (optional)..."
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => submitOverride('present')}
                className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Mark Present
              </button>
              <button
                onClick={() => submitOverride('absent')}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Mark Absent
              </button>
              <button
                onClick={() => submitOverride('late')}
                className="rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
              >
                Mark Late
              </button>
              <button
                onClick={() => submitOverride('excused')}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Mark Excused
              </button>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={closeOverrideModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassAttendanceView;
