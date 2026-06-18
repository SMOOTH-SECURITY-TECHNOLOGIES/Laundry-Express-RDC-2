import type { ComponentProps } from 'react';
import type { Icon } from '../components/Icon';
import type { LogisticsSection } from '../components/logistics/logistics-types';
import { pilotConfig } from './pilot';

type IconName = ComponentProps<typeof Icon>['name'];

export interface LogisticsNavItem {
  target: LogisticsSection;
  icon: IconName;
  label: string;
  /** Badge dynamique (ex. alertes temps réel) */
  badgeKey?: 'alerts';
  /** Affiché dans la barre de navigation mobile basse */
  mobileQuick?: boolean;
}

export function buildLogisticsNavItems(): LogisticsNavItem[] {
  const items: LogisticsNavItem[] = [
    { target: 'dashboard', icon: 'home', label: 'Dashboard', mobileQuick: true },
    { target: 'fleet', icon: 'truck', label: 'Fleet' },
    { target: 'drivers', icon: 'user', label: 'Drivers' },
    { target: 'dispatch', icon: 'shoppingBag', label: 'Dispatch', mobileQuick: true },
    { target: 'missions', icon: 'list', label: 'Missions', mobileQuick: true },
    { target: 'tracking', icon: 'map', label: 'Tracking', mobileQuick: true },
    { target: 'trip-details', icon: 'document-text', label: 'Trip Details' },
    { target: 'shipments', icon: 'archive-box', label: 'Shipments' },
    { target: 'alerts', icon: 'bell', label: 'Alertes', badgeKey: 'alerts', mobileQuick: true },
  ];

  if (pilotConfig.isPilotMode) {
    items.push({ target: 'pilot', icon: 'chartBar', label: 'Pilote' });
  }

  items.push(
    { target: 'maintenance', icon: 'arrow-path', label: 'Maintenance' },
    { target: 'reports', icon: 'document-text', label: 'Reports' },
    { target: 'settings', icon: 'settings', label: 'Settings' },
  );

  return items;
}

export function getLogisticsMobileQuickNav(items = buildLogisticsNavItems()): LogisticsNavItem[] {
  return items.filter((item) => item.mobileQuick);
}
