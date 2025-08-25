import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axios';

// Attendance Queries
export const useAttendanceHistory = (filters = {}) => {
  return useQuery({
    queryKey: ['attendanceHistory', filters],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/attendance/', { params: filters });
      return response.data;
    },
  });
};

export const useAttendanceStatus = (scheduleId) => {
  return useQuery({
    queryKey: ['attendanceStatus', scheduleId],
    queryFn: async () => {
      const endpoint = scheduleId 
        ? `/api/attendance/status/${scheduleId}/` 
        : '/api/attendance/status/today/';
      const response = await axiosInstance.get(endpoint);
      return response.data;
    },
    enabled: !!scheduleId || scheduleId === undefined,
  });
};

export const useTodaySchedules = () => {
  return useQuery({
    queryKey: ['todaySchedules'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/schedules/today/');
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useStudentSchedules = (filters = {}) => {
  return useQuery({
    queryKey: ['studentSchedules', filters],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/schedules/', { params: filters });
      return response.data;
    },
  });
};

// Attendance Mutations
export const useClockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, photoBase64 }) => {
      const response = await axiosInstance.post('/api/attendance/clock_in/', {
        schedule_id: scheduleId,
        photo: photoBase64,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attendanceStatus']);
      queryClient.invalidateQueries(['todaySchedules']);
      queryClient.invalidateQueries(['attendanceHistory']);
    },
  });
};

export const useClockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, photoBase64 }) => {
      const response = await axiosInstance.post('/api/attendance/clock_out/', {
        schedule_id: scheduleId,
        photo: photoBase64,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attendanceStatus']);
      queryClient.invalidateQueries(['todaySchedules']);
      queryClient.invalidateQueries(['attendanceHistory']);
    },
  });
};

// Utility functions
export const getAttendanceStatusColor = (status) => {
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

export const calculateTimeUntilClass = (startTime) => {
  const now = new Date();
  const classTime = new Date(startTime);
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
