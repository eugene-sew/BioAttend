/* eslint-disable no-unused-vars */
import { Component } from 'react';
import { cn } from '../../utils/cn';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (import.meta.env.VITE_MODE === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Here you could also log to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, showDetails = false, className } = this.props;

    if (hasError) {
      // Custom fallback component
      if (fallback) {
        return fallback(error, errorInfo, this.handleReset);
      }

      // Default error UI
      return (
        <div
          className={cn(
            'flex min-h-[400px] items-center justify-center p-4',
            className
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Oops! Something went wrong
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We're sorry, but something unexpected happened. Please try
                refreshing the page or contact support if the problem persists.
              </p>
              {errorCount > 2 && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  Multiple errors detected. Please refresh the page.
                </p>
              )}
            </div>

            {/* Error Details (Development/Debug Mode) */}
            {showDetails && error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Error Details
                </summary>
                <div className="mt-2 rounded bg-gray-50 p-3 font-mono text-xs dark:bg-gray-900">
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {error.toString()}
                  </p>
                  {errorInfo && (
                    <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Refresh page"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                aria-label="Try again"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
