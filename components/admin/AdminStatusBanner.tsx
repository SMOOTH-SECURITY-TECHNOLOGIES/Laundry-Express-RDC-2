import React from 'react';
import { Icon } from '../Icon';

type AdminStatusBannerVariant = 'warning' | 'info';

interface AdminStatusBannerProps {
  variant?: AdminStatusBannerVariant;
  showIcon?: boolean;
  children: React.ReactNode;
}

/** Admin alert strip — styles live in index.css (.admin-status-banner) for reliable dark mode. */
export function AdminStatusBanner({
  variant = 'warning',
  showIcon = true,
  children,
}: AdminStatusBannerProps) {
  const isWarning = variant === 'warning';

  return (
    <div
      role="status"
      className={isWarning ? 'admin-status-banner admin-status-banner--warning' : 'admin-status-banner admin-status-banner--info'}
    >
      {showIcon && (
        <Icon
          name={isWarning ? 'warning' : 'check'}
          className={`w-4 h-4 shrink-0 mt-0.5 ${isWarning ? 'admin-status-banner__icon--warning' : 'admin-status-banner__icon--info'}`}
        />
      )}
      <span>{children}</span>
    </div>
  );
}
