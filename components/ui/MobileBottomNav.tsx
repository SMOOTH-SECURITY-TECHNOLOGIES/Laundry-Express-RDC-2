import React from 'react';
import { Icon } from '../Icon';

export interface MobileNavItem {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  badge?: number;
}

interface MobileBottomNavProps {
  items: MobileNavItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  activeKey,
  onChange,
}) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-surface-card/95 backdrop-blur-lg md:hidden">
    <div className="flex items-center justify-around px-2 py-1">
      {items.map((item) => {
        const active = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`relative flex min-w-[60px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-center transition ${
              active
                ? 'text-brand-blue'
                : 'text-content-muted active:bg-surface-muted'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative">
              <Icon name={item.icon} className="h-5 w-5" />
              {item.badge != null && item.badge > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </span>
            <span className={`text-[10px] font-bold ${active ? 'text-brand-blue' : ''}`}>
              {item.label}
            </span>
            {active && (
              <span className="absolute -top-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-brand-blue" />
            )}
          </button>
        );
      })}
    </div>
  </nav>
);

export default MobileBottomNav;
