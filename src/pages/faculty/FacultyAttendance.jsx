import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import ClassAttendanceView from '../../components/attendance/ClassAttendanceView';
import useScheduleApi from '../../hooks/useScheduleApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const FacultyAttendance = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const [filterDate, setFilterDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  const { getSchedules } = useScheduleApi();

  useEffect(() => {
    // Reset selection when date changes to avoid stale selection
    setSelectedSchedule(null);
    fetchTodaySchedules();
  }, [filterDate]);

  const fetchTodaySchedules = async () => {
    setIsLoading(true);
    try {
      setScheduleError(null);
      const data = await getSchedules({
        date: filterDate,
        is_active: true,
      });
      const schedulesData = data.results || data || [];
      setSchedules(schedulesData);

      // Auto-select first schedule if available
      if (schedulesData.length > 0 && !selectedSchedule) {
        setSelectedSchedule(schedulesData[0]);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setScheduleError(error?.response?.data?.error || 'Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduleStatus = (schedule) => {
    const now = new Date();

    // Robust time parsing similar to ScheduleList
    const parseTimeString = (val) => {
      if (!val) return null;
      if (typeof val === 'string' && val.includes('T')) {
        const dt = parseISO(val);
        return isNaN(dt) ? null : dt;
      }
      if (val instanceof Date) return val;
      if (typeof val === 'string') {
        const m = val.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (m) {
          const h = parseInt(m[1], 10);
          const min = parseInt(m[2], 10);
          const s = m[3] ? parseInt(m[3], 10) : 0;
          const d = new Date();
          d.setHours(h, min, s, 0);
          return d;
        }
      }
      return null;
    };

    const baseDate = schedule?.date
      ? parseISO(schedule.date)
      : schedule?.start_time?.includes('T')
        ? parseISO(schedule.start_time)
        : parseISO(filterDate);

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
      return {
        text: 'Scheduled',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
      };
    }

    if (now >= startTime && now <= endTime) {
      return {
        text: 'Ongoing',
        color: 'bg-green-100 text-green-800 border-green-300',
      };
    } else if (now < startTime) {
      return {
        text: 'Upcoming',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    } else {
      return {
        text: 'Completed',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
      };
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
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Take Attendance
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage student attendance in real-time
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="pt-6">
              <button
                onClick={fetchTodaySchedules}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        {scheduleError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {String(scheduleError)}
          </div>
        )}
      </div>

      {/* Schedule Selection */}
      {schedules.length > 0 ? (
        <>
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              Select Class
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schedules.map((schedule) => {
                const status = getScheduleStatus(schedule);
                const isSelected = selectedSchedule?.id === schedule.id;

                return (
                  <button
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-medium text-gray-900">
                        {schedule.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${status.color}`}
                      >
                        {status.text}
                      </span>
                    </div>
                    <p className="mb-1 text-sm text-gray-600">
                      {(() => {
                        // Reuse builders from status fn scope
                        const baseDate = schedule?.date
                          ? parseISO(schedule.date)
                          : schedule?.start_time?.includes('T')
                            ? parseISO(schedule.start_time)
                            : parseISO(filterDate);
                        const buildDateTime = (val) => {
                          if (!val) return null;
                          if (typeof val === 'string' && val.includes('T')) {
                            const dt = parseISO(val);
                            return isNaN(dt) ? null : dt;
                          }
                          const m =
                            typeof val === 'string' &&
                            val
                              .trim()
                              .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
                          if (!m) return null;
                          const h = parseInt(m[1], 10);
                          const min = parseInt(m[2], 10);
                          const s = m[3] ? parseInt(m[3], 10) : 0;
                          const d = new Date(baseDate);
                          d.setHours(h, min, s, 0);
                          return d;
                        };
                        const st = buildDateTime(schedule.start_time);
                        const et = buildDateTime(schedule.end_time);
                        const left =
                          st && !isNaN(st) ? format(st, 'h:mm a') : '—';
                        const right =
                          et && !isNaN(et) ? format(et, 'h:mm a') : '—';
                        return `${left} - ${right}`;
                      })()}
                    </p>
                    {schedule.location && (
                      <p className="flex items-center text-sm text-gray-500">
                        <svg
                          className="mr-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {schedule.location}
                      </p>
                    )}
                    {isSelected && (
                      <div className="mt-2 border-t border-indigo-200 pt-2">
                        <span className="text-xs font-medium text-indigo-600">
                          Currently Selected
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attendance View */}
          {selectedSchedule && (
            <ClassAttendanceView
              scheduleId={selectedSchedule.id}
              scheduleTitle={selectedSchedule.title}
              date={filterDate}
            />
          )}
        </>
      ) : (
        <div className="rounded-lg bg-white p-8 shadow">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No schedules found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No classes scheduled for{' '}
              {format(new Date(filterDate), 'MMMM d, yyyy')}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setFilterDate(format(new Date(), 'yyyy-MM-dd'))}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Go to Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAttendance;
