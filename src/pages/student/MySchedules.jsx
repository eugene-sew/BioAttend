/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleApi, userApi } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const MySchedules = () => {
  const [view, setView] = useState('week');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const { user } = useAuthStore();

  // Fetch current user profile to get student course info
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      const res = await userApi.getProfile();
      return res?.data;
    },
  });

  const studentProfile = profileData?.student_profile;
  const studentGroupId = studentProfile?.group?.id ?? null;

  // Fetch schedules for the student's group
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['studentSchedules', view, selectedWeek, studentGroupId],
    queryFn: async () => {
      const params = {};
      if (studentGroupId) params.group = studentGroupId;
      const { data } = await scheduleApi.getSchedules(params);
      return Array.isArray(data) ? data : data?.results ?? [];
    },
    enabled: !!studentGroupId,
  });

  // Group schedules by day
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

    return grouped;
  };

  const schedulesByDay = groupSchedulesByDay(schedules || []);

  if (isProfileLoading || isLoading) {
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
          Error loading schedules: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="mt-2 text-sm text-gray-700">
            View your class schedules and course information
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                view === 'week'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                view === 'list'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Enrolled Course Info */}
      {studentProfile?.group && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Enrolled Course</h2>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-indigo-700">Course Name</dt>
                <dd className="text-lg font-semibold text-indigo-900">{studentProfile.group.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-indigo-700">Course Code</dt>
                <dd className="text-lg font-semibold text-indigo-900">{studentProfile.group.code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-indigo-700">Academic Year</dt>
                <dd className="text-lg font-semibold text-indigo-900">
                  {studentProfile.group.academic_year || 'N/A'}
                </dd>
              </div>
            </div>
            {studentProfile.group.description && (
              <div className="mt-3">
                <dt className="text-sm font-medium text-indigo-700">Description</dt>
                <dd className="text-sm text-indigo-800">{studentProfile.group.description}</dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Course Warning */}
      {!studentProfile?.group && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Course Enrolled</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You are not currently enrolled in any course. Please contact your administrator to be assigned to a course.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Content */}
      {studentProfile?.group && (
        <>
          {view === 'week' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Weekly Schedule</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                {Object.entries(schedulesByDay).map(([day, daySchedules]) => (
                  <div key={day} className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{day}</h4>
                    <div className="space-y-2">
                      {daySchedules.length > 0 ? (
                        daySchedules.map((schedule, index) => (
                          <div key={index} className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                            <div className="flex items-center text-sm text-indigo-700 mb-1">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {schedule.start_time} - {schedule.end_time}
                            </div>
                            <div className="font-medium text-indigo-900 text-sm">
                              {schedule.subject || studentProfile.group.name}
                            </div>
                            {schedule.location && (
                              <div className="flex items-center text-xs text-indigo-600 mt-1">
                                <MapPinIcon className="h-3 w-3 mr-1" />
                                {schedule.location}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 italic">No classes</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'list' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Schedule List</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {schedules && schedules.length > 0 ? (
                  schedules.map((schedule, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <CalendarIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {schedule.subject || studentProfile.group.name}
                            </h4>
                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                              <span className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {schedule.start_time} - {schedule.end_time}
                              </span>
                              {schedule.location && (
                                <span className="flex items-center">
                                  <MapPinIcon className="h-4 w-4 mr-1" />
                                  {schedule.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {schedule.date ? new Date(schedule.date).toLocaleDateString() : 'Recurring'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {schedule.day_of_week || new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'long' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No class schedules are available for your course at this time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MySchedules;
