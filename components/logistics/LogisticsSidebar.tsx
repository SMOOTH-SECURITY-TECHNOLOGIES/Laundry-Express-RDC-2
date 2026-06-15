import React from 'react';
import { Icon } from '../Icon';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { LogisticsSection } from './logistics-types';

interface LogisticsSidebarProps {
  activeSection: string;
  onSectionClick: (section: string) => void;
  onNavigateHome: () => void;
  onLogout: () => void;
  mobile?: boolean;
}

const navItems: {
  target: LogisticsSection;
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  badge?: number;
}[] = [
  { target: 'dashboard', icon: 'logo', label: 'Centre logistique' },
  { target: 'missions', icon: 'shoppingBag', label: 'Missions' },
  { target: 'drivers', icon: 'user', label: 'Chauffeurs' },
  { target: 'performance', icon: 'chartBar', label: 'Performance' },
  { target: 'alerts', icon: 'bell', label: 'Alertes', badge: 5 },
  { target: 'reports', icon: 'document-text', label: 'Rapports' },
  { target: 'settings', icon: 'settings', label: 'Paramètres' },
];

export const LogisticsSidebar: React.FC<LogisticsSidebarProps> = ({
  activeSection,
  onSectionClick,
  onNavigateHome,
  onLogout,
  mobile = false,
}) => (
  <aside
    className={`${
      mobile ? 'flex h-full w-full' : 'fixed inset-y-0 left-0 z-50 hidden w-[260px] md:flex'
    } flex-col border-r border-surface-border bg-surface-card px-4 py-5`}
  >
    <button
      type="button"
      onClick={onNavigateHome}
      className="mb-6 flex shrink-0 items-center gap-3 px-2 text-left"
      aria-label="Retour à l’accueil"
    >
      <Icon name="logo" className="h-9 w-9 text-brand-blue" />
      <span className="text-xl font-black text-content-primary">Laundry Express</span>
    </button>

    <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" aria-label="Navigation logistique">
      {navItems.map((item) => {
        const isActive = activeSection === item.target;
        return (
          <button
            key={item.target}
            type="button"
            onClick={() => onSectionClick(item.target)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
              isActive
                ? 'bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/20'
                : 'text-content-muted hover:bg-surface-muted'
            }`}
          >
            <Icon name={item.icon} className={`h-5 w-5 ${isActive ? 'text-brand-blue' : 'text-content-muted'}`} />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>

    <div className="mt-4 shrink-0 space-y-3">
      <div className={`flex items-center justify-between rounded-xl border border-surface-border-subtle px-4 py-3 ${mobile ? '' : 'hidden md:flex'}`}>
        <span className="text-xs font-bold text-content-muted">Thème</span>
        <ThemeSwitcher />
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-xl border border-surface-border-subtle px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        <Icon name="arrowRight" className="h-5 w-5" />
        Déconnexion
      </button>
    </div>
  </aside>
);
