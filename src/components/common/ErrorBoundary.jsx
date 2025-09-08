// Temporarily disabled ErrorBoundary to stop recursive error loops
const ErrorBoundary = ({ children }) => {
  return children;
};

export default ErrorBoundary;
