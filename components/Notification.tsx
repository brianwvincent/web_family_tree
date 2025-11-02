import React from 'react';
import CloseIcon from './icons/CloseIcon';

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

interface NotificationProps {
  message: string;
  type?: NotificationType;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type = 'info',
  onClose 
}) => {
  const typeStyles = {
    error: {
      bg: 'bg-red-800/50',
      text: 'text-red-300',
      border: 'border-red-700/50',
      icon: '⚠️'
    },
    success: {
      bg: 'bg-green-800/50',
      text: 'text-green-300',
      border: 'border-green-700/50',
      icon: '✓'
    },
    warning: {
      bg: 'bg-yellow-800/50',
      text: 'text-yellow-300',
      border: 'border-yellow-700/50',
      icon: '⚠'
    },
    info: {
      bg: 'bg-blue-800/50',
      text: 'text-blue-300',
      border: 'border-blue-700/50',
      icon: 'ℹ'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className={`p-3 ${styles.bg} ${styles.text} border ${styles.border} rounded-lg text-sm flex items-start gap-3`}>
      <span className="text-lg leading-none mt-0.5">{styles.icon}</span>
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Close notification"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Notification;
