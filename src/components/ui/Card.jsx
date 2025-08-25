import { cn } from '../../utils/cn';

const Card = ({ 
  children, 
  className, 
  hoverable = false,
  shadow = 'md',
  padding = 'md',
  ...props 
}) => {
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg',
        shadowClasses[shadow],
        paddingClasses[padding],
        hoverable && 'transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        'pb-3 mb-3 border-b border-gray-200 dark:border-gray-700',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className, as: Component = 'h3', ...props }) => {
  return (
    <Component 
      className={cn(
        'text-lg font-semibold text-gray-900 dark:text-white',
        className
      )} 
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardDescription = ({ children, className, ...props }) => {
  return (
    <p 
      className={cn(
        'mt-1 text-sm text-gray-500 dark:text-gray-400',
        className
      )} 
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div className={cn('text-gray-700 dark:text-gray-300', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        'pt-3 mt-3 border-t border-gray-200 dark:border-gray-700',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

// Stats Card variant
export const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon,
  trend,
  trendValue,
  className 
}) => {
  const isPositiveTrend = trend === 'up';

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
          {trendValue && (
            <div className="mt-3 flex items-center">
              <span className={cn(
                'inline-flex items-center text-sm font-medium',
                isPositiveTrend ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {isPositiveTrend ? (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;
