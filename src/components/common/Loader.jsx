import { cn } from '../../utils/cn';

const Loader = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text = '',
  fullScreen = false,
  overlay = false,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const colorClasses = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-cyan-600 dark:text-cyan-400',
    white: 'text-white',
    dark: 'text-gray-900 dark:text-gray-100',
  };

  const spinnerElement = (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color]
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const dotsElement = (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-bounce',
            sizeClasses[size].replace('h-', 'h-').replace('w-', 'w-').split(' ')[0].replace('h-', 'h-') + '/3',
            sizeClasses[size].replace('h-', 'h-').replace('w-', 'w-').split(' ')[1].replace('w-', 'w-') + '/3',
            colorClasses[color],
            'bg-current'
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );

  const pulseElement = (
    <div className="relative">
      <div
        className={cn(
          'rounded-full animate-ping absolute inline-flex h-full w-full opacity-75',
          sizeClasses[size],
          colorClasses[color],
          'bg-current'
        )}
      />
      <div
        className={cn(
          'relative inline-flex rounded-full',
          sizeClasses[size],
          colorClasses[color],
          'bg-current'
        )}
      />
    </div>
  );

  const barsElement = (
    <div className="flex space-x-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse',
            'w-1',
            sizeClasses[size].split(' ')[0],
            colorClasses[color],
            'bg-current'
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );

  const getLoaderElement = () => {
    switch (variant) {
      case 'dots':
        return dotsElement;
      case 'pulse':
        return pulseElement;
      case 'bars':
        return barsElement;
      case 'spinner':
      default:
        return spinnerElement;
    }
  };

  const loaderContent = (
    <div 
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {getLoaderElement()}
      {text && (
        <span className={cn(
          textSizeClasses[size],
          colorClasses[color],
          'font-medium'
        )}>
          {text}
        </span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
        {loaderContent}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

// Skeleton Loader Component
export const SkeletonLoader = ({ 
  className = '', 
  animate = true,
  rounded = 'md',
  height = 'h-4'
}) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        animate && 'animate-pulse',
        roundedClasses[rounded],
        height,
        className
      )}
      aria-hidden="true"
    />
  );
};

// Card Skeleton Loader
export const CardSkeletonLoader = ({ showAvatar = false }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <SkeletonLoader className="h-10 w-10" rounded="full" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-4 w-1/4" />
            <SkeletonLoader className="h-3 w-1/3" />
          </div>
        </div>
      )}
      <SkeletonLoader className="h-4 w-3/4" />
      <SkeletonLoader className="h-4 w-full" />
      <SkeletonLoader className="h-4 w-5/6" />
      <div className="flex space-x-2 pt-2">
        <SkeletonLoader className="h-8 w-20" />
        <SkeletonLoader className="h-8 w-20" />
      </div>
    </div>
  );
};

// Table Skeleton Loader
export const TableSkeletonLoader = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonLoader key={`header-${i}`} className="h-4" />
          ))}
        </div>
      </div>
      {/* Body */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonLoader 
                  key={`cell-${rowIndex}-${colIndex}`} 
                  className="h-4" 
                  animate={true}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Loader;
