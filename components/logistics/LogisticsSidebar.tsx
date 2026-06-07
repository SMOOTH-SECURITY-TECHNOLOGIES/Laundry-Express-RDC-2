import React from 'react';
import { Icon } from '../Icon';

interface LogisticsSidebarProps {
  activeSection: string;
  onSectionClick: (section: string) => void;
}

const navItems = [
  { target: 'dashboard', icon: 'logo' as const, label: 'Centre logistique' },
  { target: 'missions', icon: 'shoppingBag' as const, label: 'Missions' },
  { target: 'drivers', icon: 'user' as const, label: 'Chauffeurs' },
  { target: 'performance', icon: 'chartBar' as const, label: 'Performance' },
  { target: 'alerts', icon: 'bell' as const, label: 'Alertes', badge: 5 },
  { target: 'reports', icon: 'document-text' as const, label: 'Rapports' },
  { target: 'settings', icon: 'pencil' as const, label: 'Paramètres' },
];

export const LogisticsSidebar: React.FC<LogisticsSidebarProps> = ({ activeSection, onSectionClick }) => {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = activeSection === item.target;
        return (
          <button
            key={item.target}
            onClick={() => onSectionClick(item.target)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/25'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon name={item.icon} className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
