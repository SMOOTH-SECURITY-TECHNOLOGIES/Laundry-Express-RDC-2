export type LogisticsSection =
  | 'dashboard'
  | 'missions'
  | 'drivers'
  | 'performance'
  | 'alerts'
  | 'reports'
  | 'settings';

export const LOGISTICS_SECTIONS: LogisticsSection[] = [
  'dashboard',
  'missions',
  'drivers',
  'performance',
  'alerts',
  'reports',
  'settings',
];

export const isLogisticsSection = (value: string): value is LogisticsSection =>
  LOGISTICS_SECTIONS.includes(value as LogisticsSection);
