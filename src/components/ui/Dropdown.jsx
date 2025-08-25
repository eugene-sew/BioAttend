import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

const Dropdown = ({
  trigger,
  children,
  align = 'left',
  className,
  closeOnClick = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = () => {
    if (closeOnClick) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={handleTriggerClick}>{trigger}</div>
      
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] origin-top-right rounded-lg bg-white dark:bg-gray-800',
            'shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700',
            'animate-scale-in',
            alignmentClasses[align],
            className
          )}
          onClick={handleItemClick}
        >
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({
  children,
  onClick,
  icon,
  danger = false,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        'flex w-full items-center px-4 py-2 text-sm transition-colors',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </button>
  );
};

export const DropdownDivider = () => {
  return <div className="my-1 border-t border-gray-200 dark:border-gray-700" />;
};

export default Dropdown;
