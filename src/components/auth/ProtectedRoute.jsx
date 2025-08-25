import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * ProtectedRoute HOC component for role-based access control
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {Array<string>} props.roles - Array of allowed roles for this route
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 */
const ProtectedRoute = ({ 
  children, 
  roles = [], 
  requireAuth = true 
}) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  
  // Check if authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If roles are specified, check if user has required role
  if (roles.length > 0 && user) {
    const userRole = user.role || user.user_type; // Support both 'role' and 'user_type' fields
    
    if (!userRole || !roles.includes(userRole.toUpperCase())) {
      // User doesn't have required role - redirect to 403 forbidden page
      return <Navigate to="/403" replace />;
    }
  }
  
  // If no user data yet but authenticated, show loading
  if (requireAuth && isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  // User is authorized - render children
  return children;
};

export default ProtectedRoute;
