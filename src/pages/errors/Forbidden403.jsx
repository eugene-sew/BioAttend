import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Forbidden403 = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const handleGoBack = () => {
    if (isAuthenticated && user) {
      const role = (user.role || user.user_type || '').toLowerCase();
      navigate(`/${role}/dashboard`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
              <svg 
                className="h-12 w-12 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>

            {/* Error Content */}
            <h1 className="text-6xl font-bold text-gray-900 mb-2">403</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Access Forbidden
            </h2>
            <p className="text-gray-600 mb-6">
              Sorry, you don't have permission to access this page. 
              This area is restricted to authorized users only.
            </p>

            {/* User Role Info */}
            {isAuthenticated && user && (
              <div className="bg-gray-100 rounded-md p-3 mb-6">
                <p className="text-sm text-gray-700">
                  You are logged in as: <span className="font-semibold capitalize">
                    {user.role || user.user_type || 'Unknown Role'}
                  </span>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGoBack}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forbidden403;
