import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleApi, userApi } from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MySchedules = () => {
  const [view, setView] = useState('week'); // week, month, list
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = next week, etc.

  // Fetch current user profile to derive student group (if any)
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      const res = await userApi.getProfile();
      return res?.data;
    },
  });

  const studentGroupId = profileData?.student_profile?.group?.id ?? null;

  // Fetch schedules (backend exposes /api/schedules/)
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['studentSchedules', view, selectedWeek, studentGroupId],
    queryFn: async () => {
      const params = {};
      if (studentGroupId) params.group = studentGroupId;
      const { data } = await scheduleApi.getSchedules(params);
      // Normalize to an array whether API returns a list or paginated object
      return Array.isArray(data) ? data : data?.results ?? [];
    },
    enabled: typeof studentGroupId === 'number' || studentGroupId === null,
  });

  // Group schedules by day (compute from date)
  const groupSchedulesByDay = (schedulesInput) => {
    const schedules = Array.isArray(schedulesInput) ? schedulesInput : [];
    const grouped = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => {
      grouped[day] = [];
    });

    schedules.forEach(schedule => {
      const d = schedule.date ? new Date(schedule.date) : null;
      const day = d ? d.toLocaleDateString('en-US', { weekday: 'long' }) : undefined;
      if (grouped[day]) {
        grouped[day].push(schedule);
      }
    });

    // Sort each day's schedules by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const timeA = a.start_time.split(':').map(Number);
        const timeB = b.start_time.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
    });

    return grouped;
  };

  // Get upcoming schedules (next 7 days)
  const getUpcomingSchedules = (schedulesInput) => {
    const schedules = Array.isArray(schedulesInput) ? schedulesInput : [];
    const today = new Date();
    const upcomingDays = 7;
    const upcoming = [];

    for (let i = 0; i < upcomingDays; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      const daySchedules = schedules.filter(s => s.date === iso);
      
      if (daySchedules.length > 0) {
        upcoming.push({
          date: currentDate,
          dayName,
          schedules: daySchedules
        });
      }
    }

    return upcoming;
  };

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const groupedSchedules = groupSchedulesByDay(safeSchedules);
  const upcomingSchedules = getUpcomingSchedules(safeSchedules);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Class Schedules</h2>
            <p className="mt-1 text-sm text-gray-600">
              View your upcoming classes and course schedules
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                view === 'week' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                view === 'list' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {isProfileLoading || isLoading ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      ) : error ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-16">
            <p className="text-red-500">Failed to load schedules.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Week View */}
          {view === 'week' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Schedule</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <div key={day} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{day}</h4>
                    
                    {groupedSchedules[day]?.length > 0 ? (
                      <div className="space-y-2">
                        {groupedSchedules[day].map((schedule, idx) => (
                          <div
                            key={idx}
                            className="bg-indigo-50 border border-indigo-200 rounded-md p-2"
                          >
                            <p className="text-sm font-medium text-indigo-900">
                              {schedule.course_code}
                            </p>
                            <p className="text-xs text-indigo-700 mt-1">
                              {schedule.start_time} - {schedule.end_time}
                            </p>
                            <p className="text-xs text-indigo-600 mt-1">
                              📍 {schedule.room}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No classes</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Weekend Classes */}
              {(groupedSchedules['Saturday']?.length > 0 || groupedSchedules['Sunday']?.length > 0) && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Weekend Classes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Saturday', 'Sunday'].map(day => (
                      groupedSchedules[day]?.length > 0 && (
                        <div key={day} className="border rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{day}</h5>
                          <div className="space-y-2">
                            {groupedSchedules[day].map((schedule, idx) => (
                              <div
                                key={idx}
                                className="bg-orange-50 border border-orange-200 rounded-md p-2"
                              >
                                <p className="text-sm font-medium text-orange-900">
                                  {schedule.course_code}
                                </p>
                                <p className="text-xs text-orange-700 mt-1">
                                  {schedule.start_time} - {schedule.end_time}
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                  📍 {schedule.room}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List View - Upcoming Classes */}
          {view === 'list' && (
            <div className="bg-white shadow rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Classes (Next 7 Days)</h3>
              </div>
              
              {upcomingSchedules.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {upcomingSchedules.map((dayData, dayIdx) => (
                    <div key={dayIdx} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">
                          {dayData.dayName}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {dayData.date.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {dayData.schedules.map((schedule, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-1 h-12 bg-indigo-500 rounded-full"></div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {schedule.title || schedule.course_code}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {schedule.course_code}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {schedule.start_time} - {schedule.end_time}
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {schedule.room}
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {schedule.faculty_name || 'TBA'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No upcoming classes in the next 7 days</p>
                </div>
              )}
            </div>
          )}

          {/* Course Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Enrolled Courses</h3>
            
            {safeSchedules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...new Set(safeSchedules.map(s => s.course_code))].map(courseCode => {
                  const course = safeSchedules.find(s => s.course_code === courseCode);
                  const courseSchedules = safeSchedules.filter(s => s.course_code === courseCode);
                  
                  return (
                    <div key={courseCode} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">{course.title || course.course_code}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {courseCode}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {courseSchedules.length} session{courseSchedules.length > 1 ? 's' : ''}/week
                      </p>
                      <div className="mt-2">
                        {courseSchedules.map((s, idx) => (
                          <p key={idx} className="text-xs text-gray-600">
                            {s.date ? new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }) : ''} {s.start_time}-{s.end_time}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No courses enrolled</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MySchedules;
