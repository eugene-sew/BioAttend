import { cn } from '../../utils/cn';

const Avatar = ({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  shape = 'circle',
  status,
  className,
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            'object-cover',
            sizeClasses[size],
            shapeClasses[shape],
            className
          )}
          {...props}
        />
      ) : (
        <div
          className={cn(
            'inline-flex items-center justify-center font-medium',
            'bg-gradient-to-br from-primary-400 to-primary-600 text-white',
            sizeClasses[size],
            shapeClasses[shape],
            className
          )}
          {...props}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-800',
            statusSizeClasses[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};

// Avatar Group component
export const AvatarGroup = ({ children, max = 3, size = 'md', className }) => {
  const childrenArray = Array.isArray(children) ? children : [children];
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  const overlapClasses = {
    xs: '-ml-2',
    sm: '-ml-2.5',
    md: '-ml-3',
    lg: '-ml-3.5',
    xl: '-ml-4',
    '2xl': '-ml-5',
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  return (
    <div className={cn('flex items-center', className)}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className={cn(
            'relative',
            index !== 0 && overlapClasses[size],
            'ring-2 ring-white dark:ring-gray-800 rounded-full'
          )}
        >
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative inline-flex items-center justify-center font-medium',
            'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
            'rounded-full ring-2 ring-white dark:ring-gray-800',
            overlapClasses[size],
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default Avatar;
