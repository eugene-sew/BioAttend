import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(
  ({ 
    className, 
    type = 'text', 
    label, 
    error, 
    helperText, 
    fullWidth = false, 
    required = false,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className={cn('w-full', !fullWidth && 'max-w-sm')}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'block w-full px-3 py-2 text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border rounded-lg shadow-sm',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900',
            'transition-colors duration-200',
            error
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
            className
          )}
          required={required}
          aria-required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error || helperText ? `${inputId}-helper-text` : undefined}
          {...props}
        />
        {(error || helperText) && (
          <p
            id={`${inputId}-helper-text`}
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
            role={error ? 'alert' : undefined}
            aria-live={error ? 'polite' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
export const Textarea = forwardRef(
  ({ className, label, error, helperText, fullWidth = false, rows = 4, ...props }, ref) => {
    return (
      <div className={cn('w-full', !fullWidth && 'max-w-sm')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'block w-full px-3 py-2 text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border rounded-lg shadow-sm',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900',
            'transition-colors duration-200',
            'resize-y',
            error
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${props.id}-helper-text` : undefined}
          {...props}
        />
        {(error || helperText) && (
          <p
            id={`${props.id}-helper-text`}
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select variant
export const Select = forwardRef(
  ({ className, label, error, helperText, fullWidth = false, children, ...props }, ref) => {
    return (
      <div className={cn('w-full', !fullWidth && 'max-w-sm')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'block w-full px-3 py-2 text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border rounded-lg shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900',
            'transition-colors duration-200',
            error
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${props.id}-helper-text` : undefined}
          {...props}
        >
          {children}
        </select>
        {(error || helperText) && (
          <p
            id={`${props.id}-helper-text`}
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Input;
