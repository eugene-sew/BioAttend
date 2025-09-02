/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { useUIStore, uiSelectors } from '../../store';
import Modal from './Modal';

/**
 * GlobalModal component that integrates with the uiStore
 * This allows modals to be opened from anywhere in the app using the store
 */
const GlobalModal = () => {
  const isOpen = useUIStore(uiSelectors.selectIsModalOpen);
  const activeModal = useUIStore(uiSelectors.selectActiveModal);
  const modalData = useUIStore(uiSelectors.selectModalData);
  const closeModal = useUIStore((state) => state.closeModal);
  const updateModalData = useUIStore((state) => state.updateModalData);

  // Modal configurations
  const modalConfigs = {
    confirm: {
      title: modalData?.title || 'Confirm Action',
      size: 'sm',
      content: ConfirmModalContent,
    },
    alert: {
      title: modalData?.title || 'Alert',
      size: 'sm',
      content: AlertModalContent,
    },
    form: {
      title: modalData?.title || 'Form',
      size: modalData?.size || 'md',
      content: FormModalContent,
    },
    custom: {
      title: modalData?.title,
      size: modalData?.size || 'md',
      content: () => modalData?.content,
    },
  };

  const config = modalConfigs[activeModal];

  if (!config) return null;

  const ContentComponent = config.content;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={config.title}
      size={config.size}
      footer={modalData?.footer}
    >
      <ContentComponent
        data={modalData}
        onClose={closeModal}
        onUpdate={updateModalData}
      />
    </Modal>
  );
};

// Confirm Modal Content
const ConfirmModalContent = ({ data, onClose }) => {
  const {
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'primary',
  } = data || {};

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  };

  return (
    <div>
      <p className="mb-6 text-gray-600 dark:text-gray-300">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses[variant]}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

// Alert Modal Content
const AlertModalContent = ({ data, onClose }) => {
  const { message = '', buttonText = 'OK', variant = 'info' } = data || {};

  const iconClasses = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  const icons = {
    info: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div>
      <div className="mb-4 flex items-start">
        <div className={`flex-shrink-0 ${iconClasses[variant]}`}>
          {icons[variant]}
        </div>
        <p className="ml-3 text-gray-600 dark:text-gray-300">{message}</p>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

// Form Modal Content (Example)
const FormModalContent = ({ data, onClose, onUpdate }) => {
  const { fields = [], onSubmit } = data || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData);

    if (onSubmit) {
      await onSubmit(values);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                rows={field.rows || 3}
                required={field.required}
                defaultValue={field.defaultValue}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 sm:text-sm"
              />
            ) : (
              <input
                type={field.type || 'text'}
                id={field.name}
                name={field.name}
                required={field.required}
                defaultValue={field.defaultValue}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 sm:text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

// Helper hook for easy modal usage
export const useModal = () => {
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  return {
    openConfirm: (options) => openModal('confirm', options),
    openAlert: (options) => openModal('alert', options),
    openForm: (options) => openModal('form', options),
    openCustom: (options) => openModal('custom', options),
    close: closeModal,
    showSuccess,
    showError,
  };
};

export default GlobalModal;
