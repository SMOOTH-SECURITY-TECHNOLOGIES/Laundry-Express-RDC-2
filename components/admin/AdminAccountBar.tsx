import React from 'react';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { useAppContext } from '../../context/AppContext';

/** Always-visible account actions for admin (logout must not depend on sidebar scroll). */
export const AdminAccountBar: React.FC = () => {
  const { user, logout, t } = useAppContext();
  const label = user?.name || user?.email || 'Admin';

  return (
    <div className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#081A44] px-4 py-2.5 lg:border-surface-border lg:bg-surface-card">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white lg:text-content-primary">{label}</p>
        {user?.email && (
          <p className="truncate text-[11px] text-slate-400 lg:text-content-muted">{user.email}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeSwitcher className="text-slate-300 lg:text-content-muted" />
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-red-400/50 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/25 lg:border-red-300 lg:bg-red-50 lg:text-red-700 lg:hover:bg-red-100 dark:lg:border-red-800 dark:lg:bg-red-900/30 dark:lg:text-red-300"
        >
          {t('header.logout', { default: 'Déconnexion' })}
        </button>
      </div>
    </div>
  );
};
