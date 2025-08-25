import { useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook to handle React Query loading and error states
 * @param {Object} options - Configuration options
 * @param {boolean} options.isLoading - Loading state from React Query
 * @param {boolean} options.isError - Error state from React Query
 * @param {Error} options.error - Error object from React Query
 * @param {Function} options.refetch - Refetch function from React Query
 * @param {boolean} options.showErrorToast - Whether to show error toast (default: true)
 * @param {string} options.errorMessage - Custom error message
 * @returns {Object} - Loading and error states with helper functions
 */
export const useQueryState = ({ 
  isLoading = false, 
  isError = false, 
  error = null, 
  refetch = null,
  showErrorToast = true,
  errorMessage = null
}) => {
  // Show error toast if enabled
  useEffect(() => {
    if (isError && showErrorToast) {
      const message = errorMessage || 
        error?.response?.data?.message || 
        error?.message || 
        'An error occurred. Please try again.';
      
      toast.error(message);
    }
  }, [isError, error, showErrorToast, errorMessage]);

  const retry = () => {
    if (refetch) {
      refetch();
    }
  };

  return {
    isLoading,
    isError,
    error,
    retry,
    errorMessage: errorMessage || error?.message || 'An error occurred'
  };
};

/**
 * Combine multiple query states
 * @param {...Object} queries - React Query results
 * @returns {Object} - Combined loading and error states
 */
export const useCombinedQueryState = (...queries) => {
  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const errors = queries
    .filter(query => query.error)
    .map(query => query.error);
  
  const refetchAll = () => {
    queries.forEach(query => {
      if (query.refetch) {
        query.refetch();
      }
    });
  };

  return {
    isLoading,
    isError,
    errors,
    refetchAll
  };
};

export default useQueryState;
