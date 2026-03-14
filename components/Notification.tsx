import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
// The Notification type for toasts is the simple one, which is correct.
import { Notification } from '../types';
import { useNotification } from '../context/NotificationContext';

const NotificationToast: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Set up exit animation
    const timeoutId = setTimeout(() => {
        setIsExiting(true);
        // Allow time for exit animation before removing from DOM
        setTimeout(() => onDismiss(notification.id), 300); 
    }, 4700); // Start exit animation slightly before removal

    return () => clearTimeout(timeoutId);
  }, [notification.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };
  
  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      iconColor: 'text-green-500',
      iconName: 'check' as const,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      iconColor: 'text-red-500',
      iconName: 'xmark' as const,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      iconColor: 'text-blue-500',
      iconName: 'bell' as const,
    },
  };

  const styles = typeStyles[notification.type] || typeStyles.info;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        w-full max-w-sm rounded-lg shadow-lg pointer-events-auto overflow-hidden
        border-l-4 ${styles.border} ${styles.bg}
        flex items-start p-4 space-x-4
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      style={{ animation: 'fadeInRight 0.5s ease-out forwards' }}
    >
      <div className={`flex-shrink-0 ${styles.iconColor}`}>
        <Icon name={styles.iconName} className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{notification.message}</p>
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={handleDismiss}
          className="inline-flex text-gray-400 rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Fermer"
        >
          <Icon name="xmark" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div 
          className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm"
          aria-live="polite"
        >
            {notifications.map(n => (
                <NotificationToast key={n.id} notification={n} onDismiss={removeNotification} />
            ))}
        </div>
    );
};

// Add keyframes to a style tag in index.html or global CSS file if needed.
// For simplicity in this project structure, we can rely on Tailwind's animation config if extended.
// Here's an example if you were to add it to index.html:
/*
<style>
@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
*/
