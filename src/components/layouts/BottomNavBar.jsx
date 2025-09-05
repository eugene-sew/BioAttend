import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const BottomNavBar = ({ navigationItems = [] }) => {
  const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mainNavItems = navigationItems.slice(0, 4);
  const moreNavItems = navigationItems.slice(4);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg md:hidden">
        <div className="flex h-16 items-center justify-around">
          {mainNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex w-full flex-col items-center justify-center transition-colors ${
                isActiveRoute(item.path)
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              {item.icon}
              <span className="mt-1 text-xs">{item.mobile}</span>
            </Link>
          ))}
          {navigationItems.length > 4 && (
            <button
              onClick={() => setMoreMenuOpen(true)}
              className="flex w-full flex-col items-center justify-center text-gray-500 transition-colors hover:text-indigo-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
              <span className="mt-1 text-xs">More</span>
            </button>
          )}
        </div>
      </div>

      {/* More Menu Modal */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto md:hidden"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div className="flex min-h-screen items-end justify-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div
              className="w-full max-w-lg transform rounded-t-lg bg-white shadow-xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    More Options
                  </h3>
                  <button
                    onClick={() => setMoreMenuOpen(false)}
                    className="rounded-full p-2 hover:bg-gray-100"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <nav className="space-y-2">
                  {moreNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreMenuOpen(false)}
                      className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors ${
                        isActiveRoute(item.path)
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-start space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <svg
                      className="h-5 w-5"
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
                    <span>Logout</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavBar;
