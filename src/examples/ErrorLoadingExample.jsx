import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Loader, { CardSkeletonLoader, TableSkeletonLoader } from '../components/common/Loader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useCombinedQueryState } from '../hooks/useQueryState';

// Example component demonstrating all features
const ErrorLoadingExample = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [throwError, setThrowError] = useState(false);

  // Simulate API call with loading and error states
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['example-data', searchTerm],
    queryFn: async () => {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate error
      if (throwError) {
        throw new Error('Simulated API error for demonstration');
      }
      
      // Return mock data
      return {
        items: [
          { id: 1, name: 'Item 1', status: 'active' },
          { id: 2, name: 'Item 2', status: 'inactive' },
          { id: 3, name: 'Item 3', status: 'active' },
        ].filter(item => 
          !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      };
    },
    enabled: true,
  });

  // Demonstrate error boundary
  if (throwError && !isError) {
    throw new Error('Component error for ErrorBoundary demonstration');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Error Handling & Loading States Demo</h1>
        
        {/* Search Input with accessibility */}
        <div className="mb-4">
          <Input
            id="search"
            label="Search Items"
            placeholder="Enter search term..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            helperText="Search will trigger a loading state"
            aria-label="Search items"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => refetch()}
            loading={isLoading}
            variant="primary"
            ariaLabel="Refresh data"
          >
            Refresh Data
          </Button>
          
          <Button
            onClick={() => setThrowError(!throwError)}
            variant={throwError ? 'danger' : 'secondary'}
            ariaLabel={throwError ? 'Disable error simulation' : 'Enable error simulation'}
          >
            {throwError ? 'Disable' : 'Enable'} Error
          </Button>
          
          <Button
            onClick={() => setShowModal(true)}
            variant="success"
            ariaLabel="Open modal dialog"
          >
            Open Modal
          </Button>
        </div>

        {/* Loading States */}
        {isLoading && (
          <div className="space-y-4">
            <Loader 
              size="lg" 
              text="Loading data..." 
              variant="spinner"
              color="primary"
            />
            
            <div className="grid gap-4">
              <CardSkeletonLoader />
              <TableSkeletonLoader rows={3} columns={3} />
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div 
            className="bg-red-50 border border-red-200 rounded-lg p-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg 
                  className="h-5 w-5 text-red-400" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Data
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error?.message || 'Something went wrong'}</p>
                </div>
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setThrowError(false);
                      refetch();
                    }}
                    variant="danger"
                    size="sm"
                    ariaLabel="Try loading data again"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Display */}
        {!isLoading && !isError && data && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Results ({data.items.length} items)</h2>
            
            {data.items.length > 0 ? (
              <div className="grid gap-3">
                {data.items.map(item => (
                  <div 
                    key={item.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    role="article"
                    aria-label={`Item: ${item.name}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        role="status"
                        aria-label={`Status: ${item.status}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No items found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessible Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Accessible Modal Example"
        ariaLabel="Example modal dialog"
        footer={
          <>
            <Button
              onClick={() => setShowModal(false)}
              variant="secondary"
              ariaLabel="Cancel and close modal"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                alert('Action confirmed!');
                setShowModal(false);
              }}
              variant="primary"
              ariaLabel="Confirm action"
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p>This modal demonstrates:</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Focus trap - Tab navigation stays within modal</li>
            <li>Escape key to close</li>
            <li>Return focus to trigger element on close</li>
            <li>Proper ARIA attributes</li>
            <li>Keyboard navigation support</li>
          </ul>
          
          <Input
            label="Test Input"
            placeholder="Try tabbing through elements"
            helperText="Focus will wrap around within the modal"
          />
        </div>
      </Modal>

      {/* Different Loader Variants */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Loader Variants</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <Loader variant="spinner" size="md" />
            <p className="mt-2 text-sm">Spinner</p>
          </div>
          
          <div className="text-center">
            <Loader variant="dots" size="md" color="success" />
            <p className="mt-2 text-sm">Dots</p>
          </div>
          
          <div className="text-center">
            <Loader variant="pulse" size="md" color="danger" />
            <p className="mt-2 text-sm">Pulse</p>
          </div>
          
          <div className="text-center">
            <Loader variant="bars" size="md" color="warning" />
            <p className="mt-2 text-sm">Bars</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with ErrorBoundary
const ErrorLoadingExampleWithBoundary = () => {
  return (
    <ErrorBoundary showDetails={true}>
      <ErrorLoadingExample />
    </ErrorBoundary>
  );
};

export default ErrorLoadingExampleWithBoundary;
