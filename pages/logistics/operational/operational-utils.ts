import type { LogisticsTask } from '../../../services/real-api';

export type PeriodKey = 'today' | 'week' | 'month';

export const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string }> = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

export const periodDays = (period: PeriodKey) => (period === 'today' ? 1 : period === 'week' ? 7 : 30);

export const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const statusIn = (status: string | null | undefined, values: string[]) =>
  values.includes((status || '').toLowerCase());

export const isWithinPeriod = (value: string | null | undefined, period: PeriodKey) => {
  const date = parseDate(value);
  if (!date) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (periodDays(period) - 1));
  return date >= start;
};

export const percentOf = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

export const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export type CorridorHealthStatus = 'SAIN' | 'ATTENTION' | 'DEGRADE';

export const toCorridorHealth = (
  status: 'SAIN' | 'ATTENTION' | 'CRITIQUE' | 'DEGRADE' | string,
): CorridorHealthStatus => {
  if (status === 'CRITIQUE') return 'DEGRADE';
  if (status === 'SAIN' || status === 'ATTENTION' || status === 'DEGRADE') return status;
  return 'ATTENTION';
};

export const minutesAgoLabel = (value: string | null | undefined) => {
  const date = parseDate(value);
  if (!date) return null;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
};

export const filterPriorityMissions = (missions: LogisticsTask[], searchQuery: string) => {
  const filtered = missions.filter((mission) => {
    if (!searchQuery.trim()) return true;
    const haystack = [
      mission.id,
      mission.order_number,
      mission.customer_name,
      mission.pickup_commune,
      mission.delivery_commune,
      mission.pickup_address_line,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });
  return filtered;
};
