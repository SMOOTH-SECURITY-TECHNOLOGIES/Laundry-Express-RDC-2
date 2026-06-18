import React from 'react';
import { buildLogisticsNavItems } from '../../config/logistics-nav';
import type { LogisticsSection } from './logistics-types';
import { MobileBottomNav } from '../ui/MobileBottomNav';

interface LogisticsMobileNavProps {
  activeSection: LogisticsSection;
  alertCount: number;
  onSectionChange: (section: LogisticsSection) => void;
}

export const LogisticsMobileNav: React.FC<LogisticsMobileNavProps> = ({
  activeSection,
  alertCount,
  onSectionChange,
}) => {
  const quickItems = buildLogisticsNavItems().filter((item) => item.mobileQuick);

  return (
    <div className="md:hidden">
      <MobileBottomNav
        items={quickItems.map((item) => ({
          key: item.target,
          label: item.label === 'Dashboard' ? 'Accueil' : item.label,
          icon: item.icon,
          badge: item.badgeKey === 'alerts' && alertCount > 0 ? alertCount : undefined,
        }))}
        activeKey={activeSection}
        onChange={(key) => onSectionChange(key as LogisticsSection)}
      />
    </div>
  );
};

export default LogisticsMobileNav;
