import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { reportsApi, scheduleApi } from '../../api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function AttendanceReport() {
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);

  // Load unique groups from schedules accessible to the user
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await scheduleApi.getSchedules({ page_size: 100 });
        const results = res?.data?.results ?? res?.data ?? [];
        const unique = new Map();
        results.forEach((s) => {
          const g = s.assigned_group_detail;
          if (g && !unique.has(g.id)) unique.set(g.id, g);
        });
        const arr = Array.from(unique.values());
        setGroups(arr);
        if (arr.length && !groupId) setGroupId(arr[0].id);
      } catch (e) {
        console.error(e);
      }
    };
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const flat = Array.isArray(data) ? data : [];
    const counters = { present: 0, late: 0, absent: 0, excused: 0, total: 0 };
    flat.forEach((row) => {
      counters.total += 1;
      const st = (row.status || '').toLowerCase();
      if (st in counters) counters[st] += 1;
    });
    return counters;
  }, [data]);

  const runReport = async () => {
    if (!groupId) {
      toast.error('Select a group');
      return;
    }
    setIsLoading(true);
    try {
      const res = await reportsApi.attendanceReport({ group: groupId, from: fromDate, to: toDate });
      setData(res?.data?.results ?? res?.data ?? []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Attendance Report</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Group</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">From</label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">To</label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={runReport}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
            >
              Run Report
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-5 gap-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">Total</p>
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

          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Check Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {Array.isArray(data) && data.length > 0 ? (
                    data.map((row, idx) => (
                      <tr key={idx}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {row.student_name || `${row.first_name ?? ''} ${row.last_name ?? ''}`}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {row.date ? format(new Date(row.date), 'yyyy-MM-dd') : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {row.status || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {row.check_in_time ? format(new Date(row.check_in_time), 'h:mm a') : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {row.check_out_time ? format(new Date(row.check_out_time), 'h:mm a') : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
