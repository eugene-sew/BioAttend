import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const firstFocusableElement = useRef(null);
  const lastFocusableElement = useRef(null);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Get all focusable elements within the modal
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    
    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex="0"]',
      '[tabindex="1"]',
    ];
    
    return Array.from(
      modalRef.current.querySelectorAll(focusableSelectors.join(','))
    ).filter(element => element.offsetParent !== null); // Filter out hidden elements
  }, []);

  // Handle focus trap
  const handleTabKey = useCallback((event) => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && closeOnEsc) {
      onClose();
    } else if (event.key === 'Tab') {
      handleTabKey(event);
    }
  }, [closeOnEsc, onClose, handleTabKey]);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement;
      const originalOverflow = document.body.style.overflow;
      const cleanupFns = [];
      
      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      cleanupFns.push(() => document.removeEventListener('keydown', handleKeyDown));

      document.body.style.overflow = 'hidden';
      cleanupFns.push(() => { document.body.style.overflow = originalOverflow; });
      
      // Set initial focus
      setTimeout(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          firstFocusableElement.current = focusableElements[0];
          lastFocusableElement.current = focusableElements[focusableElements.length - 1];
          
          // Focus on the first focusable element or the modal itself
          if (modalRef.current) {
            const closeButton = modalRef.current.querySelector('[aria-label="Close modal"]');
            if (closeButton) {
              closeButton.focus();
            } else if (firstFocusableElement.current) {
              firstFocusableElement.current.focus();
            } else {
              modalRef.current.focus();
            }
          }
        }
      }, 100);
    } else {
      // Restore focus to the previously focused element
      const el = previousActiveElement.current;
      if (el && typeof el.focus === 'function' && el.isConnected) {
        try { el.focus(); } catch (_) { /* noop */ }
      }
    }

    return () => {
      // Safety: attempt to remove listener and restore overflow regardless of state
      try { document.removeEventListener('keydown', handleKeyDown); } catch (_) {}
      try { document.body.style.overflow = 'unset'; } catch (_) {}
    };
  }, [isOpen, handleKeyDown, getFocusableElements]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleOverlayClick}
      role="presentation"
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70" 
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl',
          'animate-scale-in max-h-[90vh] flex flex-col',
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title || 'Modal dialog'}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
              aria-label="Close modal"
              type="button"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root') || document.body;
  return createPortal(modalContent, modalRoot);
};

export default Modal;
