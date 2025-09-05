import { useState } from 'react';
import BottomNavBar from './BottomNavBar';
import QuickClockInButton from '../common/QuickClockInButton';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Base Dashboard Layout Component
 * @param {Object} props
 * @param {Array} props.navigationItems - Array of navigation items for sidebar
 * @param {string} props.title - Dashboard title
 */
const DashboardLayout = ({ navigationItems = [], title = 'Dashboard' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`hidden md:flex ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 ease-in-out flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className={`font-bold text-xl text-gray-800 ${!isSidebarOpen && 'hidden'}`}>
                BioAttend
              </h2>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={isSidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"}
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className={`${!isSidebarOpen && 'text-center'}`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                  {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role || user?.user_type || 'Role'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActiveRoute(item.path)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isSidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-start space-x-3' : 'justify-center'} px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header - Sticky */}
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="px-3 py-4 md:px-6 flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">{title}</h1>
            <QuickClockInButton />
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-3 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNavBar navigationItems={navigationItems} />
    </div>
  );
};

export default DashboardLayout;
