import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance, { attendanceApi } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AttendanceHistory = () => {
  const [filter, setFilter] = useState('all'); // all, course, date
  const user = useAuthStore((s) => s.user);
  const studentId = user?.student_id || user?.studentId || '';

  // Default to last 30 days; TODO: connect to filter controls
  const { from, to } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { from: fmt(start), to: fmt(end) };
  }, []);

  // Fetch attendance records
  const { data: attendanceRecords = [], isLoading, error } = useQuery({
    queryKey: ['attendanceHistory', studentId, from, to, filter],
    enabled: !!studentId,
    queryFn: async () => {
      // TODO: Implement additional filtering logic based on 'filter' state
      const { data } = await attendanceApi.getStudentReport(studentId, { from, to });
      // Backend shape: { student: {...}, statistics: {...}, attendance_records: [...] }
      // Map to UI-friendly rows
      const rows = Array.isArray(data?.attendance_records) ? data.attendance_records : [];
      return rows.map((r, idx) => ({
        id: r.id || idx,
        date: r.date,
        course_name: r.course_title || r.course_name || r.course_code || '—',
        clock_in_time: r.check_in_time || r.clock_in_time || null,
        clock_out_time: r.check_out_time || r.clock_out_time || null,
        status: r.status || 'unknown',
      }));
    },
  });

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
        <p className="mt-1 text-sm text-gray-600">
          View your attendance records for all your courses.
        </p>
      </div>

      {/* Filters and Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          {/* TODO: Add filter controls */}
          <h3 className="text-lg font-medium text-gray-900">All Records</h3>
        </div>

        {!studentId ? (
          <div className="text-center py-16">
            <p className="text-gray-600">No student ID found on your profile. Please contact an administrator.</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500">Failed to load attendance records.</p>
            <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">{String(error?.message || '')}</pre>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.course_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.clock_in_time ? new Date(record.clock_in_time).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {attendanceRecords.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
