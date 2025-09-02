/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
import { useUIStore, uiSelectors } from '../../store';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Toast = () => {
  const toasts = useUIStore(uiSelectors.selectToasts);
  const removeToast = useUIStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const { type, message, title, duration = 5000 } = toast;

  // Auto-close effect is handled in the store
  useEffect(() => {
    // Add animation class on mount
    const element = document.getElementById(`toast-${toast.id}`);
    if (element) {
      element.classList.add('animate-slide-in-right');
    }
  }, [toast.id]);

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
    error: <XCircleIcon className="h-5 w-5 text-red-400" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />,
    info: <InformationCircleIcon className="h-5 w-5 text-blue-400" />,
  };

  const bgColors = {
    success:
      'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    warning:
      'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  };

  const textColors = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    info: 'text-blue-800 dark:text-blue-200',
  };

  const handleClose = () => {
    const element = document.getElementById(`toast-${toast.id}`);
    if (element) {
      element.classList.add('animate-slide-out-right');
      setTimeout(onClose, 300);
    } else {
      onClose();
    }
  };

  return (
    <div
      id={`toast-${toast.id}`}
      className={`flex items-start rounded-lg border p-4 shadow-lg ${bgColors[type] || bgColors.info} min-w-[300px] max-w-[400px] transition-all duration-300 ease-in-out`}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[type] || icons.info}</div>
      <div className="ml-3 flex-1">
        {title && (
          <p
            className={`text-sm font-medium ${textColors[type] || textColors.info}`}
          >
            {title}
          </p>
        )}
        <p
          className={`text-sm ${textColors[type] || textColors.info} ${title ? 'mt-1' : ''}`}
        >
          {message}
        </p>
      </div>
      <button
        onClick={handleClose}
        className={`ml-4 inline-flex rounded-md p-1.5 ${textColors[type] || textColors.info} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:hover:bg-gray-700`}
      >
        <span className="sr-only">Close</span>
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// CSS animations (add to your global CSS or Tailwind config)
const styles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

.animate-slide-out-right {
  animation: slide-out-right 0.3s ease-out;
}
`;

// Add styles to document if not already present
if (
  typeof document !== 'undefined' &&
  !document.getElementById('toast-animations')
) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'toast-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Toast;
