import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { attendanceApi, scheduleApi } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const QuickClockInButton = () => {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const queryClient = useQueryClient();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Only show for students
  if (!user || user.role !== 'STUDENT') {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const currentTimeStr = currentTime.toTimeString().slice(0, 5); // HH:MM format

  // Fetch today's schedules for the student
  const { data: todaySchedules, isLoading } = useQuery({
    queryKey: ['student-today-schedules', today],
    queryFn: async () => {
      const response = await scheduleApi.getUserSchedule(null, {
        date: today
      });
      return response.data || [];
    },
    enabled: !!user && user.role === 'STUDENT'
  });

  // Fetch today's attendance records
  const { data: attendanceRecords } = useQuery({
    queryKey: ['student-attendance-today', today],
    queryFn: async () => {
      const response = await attendanceApi.getRecords({
        date_from: today,
        date_to: today,
        user_id: user.id
      });
      return response.data?.results || [];
    },
    enabled: !!user && user.role === 'STUDENT'
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async (scheduleId) => {
      return await attendanceApi.clockIn({
        schedule_id: scheduleId,
        clock_in_time: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Clocked in successfully!', {
        icon: '✅',
        duration: 3000,
      });
      queryClient.invalidateQueries(['student-attendance-today']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to clock in');
    }
  });

  // Find current or upcoming class
  const getCurrentClass = () => {
    if (!todaySchedules || todaySchedules.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find classes that are currently active or starting within 30 minutes
    const activeOrUpcoming = todaySchedules.filter(schedule => {
      const startTime = schedule.start_time.split(':');
      const endTime = schedule.end_time.split(':');
      const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
      const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);

      // Class is active or starts within 30 minutes
      return (currentMinutes >= startMinutes - 30 && currentMinutes <= endMinutes);
    });

    return activeOrUpcoming.length > 0 ? activeOrUpcoming[0] : null;
  };

  // Check if already clocked in for the current class
  const isAlreadyClockedIn = (scheduleId) => {
    if (!attendanceRecords) return false;
    return attendanceRecords.some(record => 
      record.schedule_id === scheduleId && record.check_in_time
    );
  };

  const currentClass = getCurrentClass();
  const hasClass = currentClass !== null;
  const alreadyClockedIn = currentClass ? isAlreadyClockedIn(currentClass.id) : false;

  const handleQuickClockIn = () => {
    if (currentClass && !alreadyClockedIn) {
      clockInMutation.mutate(currentClass.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <ClockIcon className="h-5 w-5 animate-pulse" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!hasClass) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <ClockIcon className="h-5 w-5" />
        <span className="text-sm hidden md:inline">No class today</span>
      </div>
    );
  }

  if (alreadyClockedIn) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircleIcon className="h-5 w-5" />
        <span className="text-sm hidden md:inline">Checked in</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleQuickClockIn}
      disabled={clockInMutation.isLoading}
      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      <ClockIcon className="h-4 w-4" />
      <span className="hidden md:inline">
        {clockInMutation.isLoading ? 'Clocking in...' : `Clock in - ${currentClass.title}`}
      </span>
      <span className="md:hidden">
        {clockInMutation.isLoading ? 'Clocking...' : 'Clock in'}
      </span>
    </button>
  );
};

export default QuickClockInButton;
