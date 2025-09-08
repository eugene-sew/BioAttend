import { ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const QuickClockInButton = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Only show for students
  if (!user || user.role !== 'STUDENT') {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/student/attendance/clock')}
      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      <ClockIcon className="h-4 w-4" />
      <span className="hidden md:inline">Clock In / Out</span>
      <span className="md:hidden">Clock</span>
    </button>
  );
};

export default QuickClockInButton;
