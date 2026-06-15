import React, { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { NotificationPanel } from './NotificationPanel';
import { useAppContext } from '../context/AppContext';

export const NotificationBell: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { user, appNotifications } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const userNotifications = useMemo(() => {
    if (!user) return [];
    const adminTargets =
      user.role === 'admin' || user.role === 'superadmin'
        ? ['admin', 'USER-ADMIN', user.id]
        : [user.id];
    return (appNotifications || [])
      .filter((n) => adminTargets.includes(String(n.recipientId)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [appNotifications, user]);

  const unreadCount = useMemo(
    () => userNotifications.filter((n) => !n.isRead).length,
    [userNotifications],
  );

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full p-2 transition-colors hover:bg-surface-muted"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Icon
          name="bell"
          className={`h-6 w-6 ${unreadCount > 0 ? 'text-brand-blue' : 'text-content-muted'}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] animate-pulse items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface-card">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <NotificationPanel notifications={userNotifications} onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};
