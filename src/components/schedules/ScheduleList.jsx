/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useEffect } from 'react';
import { format, parseISO, parse } from 'date-fns';
import useScheduleApi from '../../hooks/useScheduleApi';
import LoadingSpinner from '../common/LoadingSpinner';
import useAuthStore from '../../store/authStore';

const ScheduleList = ({ onEdit, onDelete, onSelect }) => {
  const parseTimeString = (t) => {
    if (!t) return null;
    // Try common backend formats: 'HH:mm:ss' or 'HH:mm', else ISO
    try {
      return parse(t, 'HH:mm:ss', new Date());
    } catch (_) {}
    try {
      return parse(t, 'HH:mm', new Date());
    } catch (_) {}
    try {
      return parseISO(t);
    } catch (_) {}
    return null;
  };
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { getSchedules, deleteSchedule } = useScheduleApi();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canManage = role === 'ADMIN' || role === 'FACULTY';

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchTerm, filterDate]);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await getSchedules();
      setSchedules(data.results || data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSchedules = () => {
    let filtered = [...schedules];

    if (searchTerm) {
      filtered = filtered.filter(
        (schedule) =>
          schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          schedule.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      filtered = filtered.filter((schedule) => {
        const scheduleDate = schedule.date || schedule.start_time.split('T')[0];
        return scheduleDate === filterDate;
      });
    }

    setFilteredSchedules(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteSchedule(id);
        fetchSchedules(); // Refresh the list
        if (onDelete) onDelete(id);
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const getDayOfWeekName = (days) => {
    if (!days || days.length === 0) return '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day) => dayNames[day]).join(', ');
  };

  const getScheduleStatus = (schedule) => {
    const now = new Date();

    // Determine base date
    const baseDate = schedule?.date
      ? parseISO(schedule.date)
      : schedule?.start_time?.includes('T')
        ? parseISO(schedule.start_time)
        : now;

    // Build Date from time-only or ISO
    const buildDateTime = (val) => {
      if (!val) return null;
      if (typeof val === 'string' && val.includes('T')) {
        const dt = parseISO(val);
        return isNaN(dt) ? null : dt;
      }
      const t = parseTimeString(val);
      if (!t) return null;
      const d = new Date(baseDate);
      d.setHours(t.getHours(), t.getMinutes(), t.getSeconds() || 0, 0);
      return d;
    };

    const startTime = buildDateTime(schedule.start_time);
    const endTime = buildDateTime(schedule.end_time);

    if (!startTime || !endTime || isNaN(startTime) || isNaN(endTime)) {
      return { text: 'Scheduled', color: 'bg-gray-100 text-gray-800' };
    }

    if (now >= startTime && now <= endTime) {
      return { text: 'Ongoing', color: 'bg-green-100 text-green-800' };
    } else if (now < startTime) {
      return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: 'Completed', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDate('');
              }}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {filteredSchedules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>No schedules found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Recurring
                  </th>
                  {canManage && (
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredSchedules.map((schedule) => {
                  const status = getScheduleStatus(schedule);
                  return (
                    <tr
                      key={schedule.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onSelect && onSelect(schedule)}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {schedule.title}
                          </div>
                          {schedule.description && (
                            <div className="text-sm text-gray-500">
                              {schedule.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {(() => {
                            const d = schedule.date
                              ? parseISO(schedule.date)
                              : schedule.start_time?.includes('T')
                                ? parseISO(schedule.start_time)
                                : null;
                            return d ? format(d, 'MMM dd, yyyy') : '-';
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(() => {
                            const s = parseTimeString(schedule.start_time);
                            const e = parseTimeString(schedule.end_time);
                            if (!s || !e) return '-';
                            return `${format(s, 'h:mm a')} - ${format(e, 'h:mm a')}`;
                          })()}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {schedule.location || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${status.color}`}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {schedule.recurring ? (
                          <div>
                            <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                              {schedule.recurrence_pattern}
                            </span>
                            {schedule.days_of_week && (
                              <div className="mt-1 text-xs text-gray-500">
                                {getDayOfWeekName(schedule.days_of_week)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">One-time</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit && onEdit(schedule);
                            }}
                            className="mr-3 text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(schedule.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleList;
