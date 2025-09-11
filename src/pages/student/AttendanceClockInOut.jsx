/* eslint-disable no-unused-vars */
// Utility: strip data URL prefix to base64 string
const dataURLToBase64 = (dataUrl) => {
  if (typeof dataUrl !== 'string') return '';
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.*)$/);
  return match ? match[1] : dataUrl;
};

// Map backend/API errors to friendly messages
const getFriendlyError = (error, fallback = 'Something went wrong') => {
  try {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const serverMsg = (data?.message || data?.detail || '').toString();
    const lowerMsg = serverMsg.toLowerCase();

    // Known backend message
    if (lowerMsg.includes('no active facial enrollment')) {
      return 'No face enrollment found. Please enroll your face under Profile → Biometrics before clocking in.';
    }

    // Field errors
    const fieldErrs = data?.errors || data?.error || {};
    if (fieldErrs?.snapshot) {
      return 'We could not process your photo. Please retake a clear photo and try again.';
    }
    if (fieldErrs?.schedule_id) {
      return 'No active schedule found for your account at this time.';
    }

    // Status-specific fallbacks
    if (status === 401) return 'Your session expired. Please log in again.';
    if (status === 403)
      return 'You do not have permission to perform this action.';
    if (status === 404)
      return 'Service temporarily unavailable. Please try again shortly.';
    if (status === 415)
      return 'Image upload format not supported. Please retake and try again.';
    if (status === 429)
      return 'Too many attempts. Please wait a moment and try again.';

    // Prefer explicit server message if present
    if (serverMsg) return serverMsg;
  } catch (_) {
    // ignore
  }
  return fallback;
};

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { attendanceApi } from '../../api/axios';
import CameraCapture from '../../components/attendance/CameraCapture';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';
import axiosInstance from '../../api/axios';
import Loader, { CardSkeletonLoader } from '../../components/common/Loader';

const AttendanceClockInOut = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [clockType, setClockType] = useState('in'); // 'in' or 'out'
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [statusBySchedule, setStatusBySchedule] = useState({}); // { [scheduleId]: { status, check_in_time, check_out_time } }

  // Fetch current user to derive group filter
  const {
    data: meData,
    isLoading: meLoading,
    isError: meError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/auth/users/me/');
      return res.data;
    },
  });

  const studentGroupId =
    meData?.student_profile?.group?.id || meData?.student_profile?.group_id;

  // Fetch current schedules for today filtered by student's group
  const {
    data: todaySchedules,
    isLoading: schedulesLoading,
    isError: schedulesError,
    error: schedulesErrorDetails,
    refetch: refetchSchedules,
  } = useQuery({
    queryKey: ['todaySchedules', studentGroupId],
    queryFn: async () => {
      // Require group to avoid showing irrelevant schedules
      const groupParam = studentGroupId ? `?group=${studentGroupId}` : '';
      const response = await axiosInstance.get(
        `/api/schedules/today/${groupParam}`
      );
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!studentGroupId, // wait for profile
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch attendance status per schedule and aggregate
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const refetchStatus = async () => {
    if (!todaySchedules || todaySchedules.length === 0) {
      setStatusBySchedule({});
      return;
    }
    try {
      setStatusError(null);
      setStatusLoading(true);
      const promises = todaySchedules.map(async (sch) => {
        try {
          const res = await axiosInstance.get(
            `/api/attendance/status/${sch.id}/`
          );
          // Normalize
          if (res.data?.has_attendance && res.data.attendance) {
            const log = res.data.attendance;
            const clockedIn = !!log.check_in_time && !log.check_out_time;
            const normalized = {
              schedule_id: sch.id,
              status: clockedIn
                ? 'clocked_in'
                : (log.status || 'present').toLowerCase(),
              display_status: clockedIn
                ? 'Clocked In'
                : log.status || 'Present',
              check_in_time: log.check_in_time || null,
              check_out_time: log.check_out_time || null,
            };
            return [sch.id, normalized];
          }
          // No attendance yet
          return [
            sch.id,
            {
              schedule_id: sch.id,
              status: 'not_marked',
              display_status: 'Not Marked',
              check_in_time: null,
              check_out_time: null,
            },
          ];
        } catch (e) {
          // On error per schedule, mark as unknown
          return [
            sch.id,
            {
              schedule_id: sch.id,
              status: 'unknown',
              display_status: 'Unknown',
              check_in_time: null,
              check_out_time: null,
            },
          ];
        }
      });
      const entries = await Promise.all(promises);
      const map = Object.fromEntries(entries);
      setStatusBySchedule(map);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    refetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaySchedules]);

  // Periodic refresh of statuses
  useEffect(() => {
    const id = setInterval(() => {
      refetchStatus();
    }, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clock In mutation
  const clockInMutation = useMutation({
    mutationFn: async ({ scheduleId, photoBase64 }) => {
      const payload = {
        schedule_id: scheduleId,
        snapshot: dataURLToBase64(photoBase64),
      };
      const response = await axiosInstance.post(
        '/api/attendance/clock_in/',
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Some backends return 200 with success:false and a message
      const msg = data?.message || '';
      const lower = (msg || '').toLowerCase();
      if (
        data?.success === false ||
        lower.includes('no active facial enrollment')
      ) {
        toast.error(
          lower.includes('no active facial enrollment')
            ? 'No face enrollment found. Please enroll your face under Profile → Biometrics before clocking in.'
            : msg || 'Clock-in failed'
        );
        return;
      }
      toast.success('Clock-in successful');
      // refetch relevant queries here if necessary
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Clock-in failed'));
    },
  });

  // Clock Out mutation
  const clockOutMutation = useMutation({
    mutationFn: async ({ scheduleId, photoBase64 }) => {
      const payload = {
        schedule_id: scheduleId,
        snapshot: dataURLToBase64(photoBase64),
      };
      const response = await axiosInstance.post(
        '/api/attendance/clock_out/',
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      const msg = data?.message || '';
      const lower = (msg || '').toLowerCase();
      if (
        data?.success === false ||
        lower.includes('no active facial enrollment')
      ) {
        toast.error(
          lower.includes('no active facial enrollment')
            ? 'No face enrollment found. Please enroll your face under Profile → Biometrics before clocking out.'
            : msg || 'Clock-out failed'
        );
        return;
      }
      toast.success('Clock-out successful');
      // refetch relevant queries here if necessary
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Clock-out failed'));
    },
  });

  // Handle camera capture
  const handleCameraCapture = async (capturedDataUrl) => {
    if (!selectedSchedule) {
      toast.error('No active schedule found');
      return;
    }
    // Prevent double submissions in React StrictMode / rapid taps
    if (clockType === 'in' && clockInMutation.isPending) return;
    if (clockType === 'out' && clockOutMutation.isPending) return;
    try {
      if (clockType === 'in') {
        await clockInMutation.mutateAsync({
          scheduleId: selectedSchedule.id,
          photoBase64: capturedDataUrl,
        });
      } else {
        await clockOutMutation.mutateAsync({
          scheduleId: selectedSchedule.id,
          photoBase64: capturedDataUrl,
        });
      }
    } catch (error) {
      // Surface a friendly toast in case onError was bypassed
      toast.error(getFriendlyError(error, 'Clock-in failed'));
    }
  };

  // Manual check request mutation
  const manualRequestMutation = useMutation({
    mutationFn: async ({ scheduleId, reason }) => {
      const response = await attendanceApi.requestManualCheck({
        schedule_id: scheduleId,
        reason: reason || 'Facial recognition issue',
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Manual check request sent to your lecturer');
      // Optionally trigger Pusher notification here
    },
    onError: (error) => {
      toast.error(
        getFriendlyError(error, 'Failed to send manual check request')
      );
    },
  });

  const handleManualRequest = (schedule) => {
    const reason = prompt(
      'Please provide a reason for manual check request (optional):'
    );
    if (reason !== null) {
      // User didn't cancel
      manualRequestMutation.mutate({
        scheduleId: schedule.id,
        reason: reason.trim() || 'Facial recognition issue',
      });
    }
  };
  const openCameraForAttendance = (schedule, type) => {
    setSelectedSchedule(schedule);
    setClockType(type);
    setShowCamera(true);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'clocked_in':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get action button state
  const getActionButton = (schedule) => {
    const status = statusBySchedule[schedule.id];

    if (!status || status.status === 'not_marked') {
      // Can clock in
      return (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => openCameraForAttendance(schedule, 'in')}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Clock In
          </button>
          <button
            onClick={() => handleManualRequest(schedule)}
            className="flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700"
            title="Request manual check from lecturer"
          >
            <HandRaisedIcon className="h-4 w-4" />
            <span className="ml-1 sm:hidden">Manual Request</span>
          </button>
        </div>
      );
    } else if (status.status === 'clocked_in') {
      // Can clock out
      return (
        <button
          onClick={() => openCameraForAttendance(schedule, 'out')}
          className="rounded-md bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700"
        >
          Clock Out
        </button>
      );
    } else if (status.status === 'present' || status.status === 'late') {
      // Already completed
      return (
        <span className="text-sm text-gray-500">Attendance Completed</span>
      );
    }

    return null;
  };

  // Calculate time until class
  const getTimeUntilClass = (schedule) => {
    if (!schedule?.date || !schedule?.start_time) return '';
    const now = new Date();
    const classTime = new Date(`${schedule.date}T${schedule.start_time}`);
    const diff = classTime - now;

    if (diff < 0) {
      return 'Class has started';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Starts in ${hours}h ${minutes}m`;
    }
    return `Starts in ${minutes}m`;
  };

  const isLoading = meLoading || schedulesLoading || statusLoading;
  const hasError = meError || schedulesError || statusError;

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-0">
      {/* Header */}
      <div className="rounded-lg bg-white p-4 shadow md:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              Attendance Clock-In/Out
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Mark your attendance for today's classes
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-500">Current Time</p>
            <p
              className="text-lg font-semibold text-gray-900"
              aria-live="polite"
            >
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4"
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Failed to load data
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {schedulesErrorDetails?.message ||
                    'Something went wrong. Please try again.'}
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    refetchSchedules();
                    refetchStatus();
                  }}
                  className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Classes */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeletonLoader />
          <CardSkeletonLoader />
        </div>
      ) : (
        !hasError && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Today's Classes
            </h3>

            {todaySchedules && todaySchedules.length > 0 ? (
              <div className="space-y-4">
                {todaySchedules.map((schedule) => {
                  const status = statusBySchedule[schedule.id];

                  return (
                    <div
                      key={schedule.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {schedule.title}
                            </h4>
                            {status && (
                              <span
                                className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(status.status)}`}
                              >
                                {status.display_status || status.status}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <svg
                                className="mr-1 h-4 w-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {schedule.start_time} - {schedule.end_time}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg
                                className="mr-1 h-4 w-4 flex-shrink-0"
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
                              {schedule.room}
                            </div>
                            <div className="text-sm font-medium text-indigo-600">
                              {getTimeUntilClass(schedule)}
                            </div>
                          </div>
                          {status?.check_in_time && (
                            <div className="mt-2 text-xs text-gray-500">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                                <span>
                                  Clocked in at:{' '}
                                  {new Date(
                                    `${schedule.date}T${status.check_in_time}`
                                  ).toLocaleTimeString()}
                                </span>
                                {status.check_out_time && (
                                  <span>
                                    • Clocked out at:{' '}
                                    {new Date(
                                      `${schedule.date}T${status.check_out_time}`
                                    ).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end lg:ml-4">
                          {getActionButton(schedule)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
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
                <p className="mt-2 text-sm text-gray-500">
                  No classes scheduled for today
                </p>
              </div>
            )}
          </div>
        )
      )}

      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              How to mark attendance
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-inside list-disc space-y-1">
                <li>Click "Clock In" when you arrive at class</li>
                <li>Take a clear photo of your face for verification</li>
                <li>Click "Clock Out" when the class ends</li>
                <li>
                  Attendance is marked as late if you clock in after the grace
                  period
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default AttendanceClockInOut;
