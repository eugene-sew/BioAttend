import { cn } from '../../utils/cn';
import Card from './Card';

// Responsive card component for mobile table views
export const ResponsiveCard = ({ 
  children, 
  className, 
  hoverable = true,
  ...props 
}) => {
  return (
    <Card
      className={cn(
        'border border-gray-200 dark:border-gray-700',
        hoverable && 'hover:shadow-lg transition-shadow duration-200',
        className
      )}
      padding="md"
      {...props}
    >
      {children}
    </Card>
  );
};

// Card field component for key-value pairs
export const CardField = ({ 
  label, 
  value, 
  className,
  labelClassName,
  valueClassName,
  ...props 
}) => {
  return (
    <div className={cn('flex justify-between items-start py-2', className)} {...props}>
      <span className={cn('text-sm font-medium text-gray-600 dark:text-gray-400', labelClassName)}>
        {label}
      </span>
      <span className={cn('text-sm text-gray-900 dark:text-gray-100 text-right ml-4', valueClassName)}>
        {value}
      </span>
    </div>
  );
};

// Card actions component
export const CardActions = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <div className={cn('flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-200 dark:border-gray-700', className)} {...props}>
      {children}
    </div>
  );
};

export default ResponsiveCard;
