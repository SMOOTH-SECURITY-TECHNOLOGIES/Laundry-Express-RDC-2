import type { AnomalySeverity, AnomalyCorridor, AnomalyStatus, SystemHealthStatus } from './anomalies-types';

const severityLabels: Record<AnomalySeverity, string> = {
  critical: 'Critique',
  major: 'Majeure',
  medium: 'Moyen',
  low: 'Faible',
};

const corridorLabels: Record<AnomalyCorridor, string> = {
  order: 'Commande',
  payment: 'Paiement',
  logistics: 'Logistique',
  marketplace: 'Marketplace',
  system: 'Système',
};

const statusLabels: Record<AnomalyStatus, string> = {
  open: 'Ouvert',
  investigating: 'Investigation',
  resolved: 'Résolu',
  ignored: 'Ignoré',
};

const healthLabels: Record<SystemHealthStatus, string> = {
  healthy: 'Opérationnel',
  warning: 'Dégradé',
  down: 'Hors ligne',
};

const severityIconMap: Record<AnomalySeverity, string> = {
  critical: 'exclamation-circle',
  major: 'warning',
  medium: 'clock',
  low: 'check',
};

const corridorIconMap: Record<AnomalyCorridor, string> = {
  order: 'shoppingBag',
  payment: 'credit-card',
  logistics: 'truck',
  marketplace: 'building',
  system: 'computer',
};

const healthIconMap: Record<SystemHealthStatus, string> = {
  healthy: 'check',
  warning: 'warning',
  down: 'exclamation-circle',
};

const healthColorMap: Record<SystemHealthStatus, { bg: string; text: string }> = {
  healthy: { bg: 'bg-green-100', text: 'text-green-600' },
  warning: { bg: 'bg-orange-100', text: 'text-orange-600' },
  down: { bg: 'bg-red-100', text: 'text-red-600' },
};

const statusDotColor: Record<SystemHealthStatus, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-orange-500',
  down: 'bg-red-500',
};

const statusBadgeColor: Record<AnomalySeverity | 'healthy', string> = {
  critical: 'bg-red-100 text-red-700',
  major: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
  healthy: 'bg-green-100 text-green-700',
};

export function getSeverityLabel(severity: AnomalySeverity): string {
  return severityLabels[severity] ?? severity;
}

export function getCorridorLabel(corridor: AnomalyCorridor): string {
  return corridorLabels[corridor] ?? corridor;
}

export function getStatusLabel(status: AnomalyStatus): string {
  return statusLabels[status] ?? status;
}

export function getHealthLabel(status: SystemHealthStatus): string {
  return healthLabels[status] ?? status;
}

export function getSeverityIcon(severity: AnomalySeverity): string {
  return severityIconMap[severity] ?? 'circle';
}

export function getCorridorIcon(corridor: AnomalyCorridor): string {
  return corridorIconMap[corridor] ?? 'circle';
}

export function getHealthIcon(status: SystemHealthStatus): string {
  return healthIconMap[status] ?? 'circle';
}

export function getHealthColors(status: SystemHealthStatus): { bg: string; text: string } {
  return healthColorMap[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
}

export function getStatusDotColor(status: SystemHealthStatus): string {
  return statusDotColor[status] ?? 'bg-gray-400';
}

export function getStatusBadgeColor(status: AnomalySeverity | 'healthy'): string {
  return statusBadgeColor[status] ?? 'bg-gray-100 text-gray-700';
}

export function formatImpactAmount(amount: number, currency: 'USD' | 'CDF' = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : 'FC';
  return `${symbol}${amount.toLocaleString('fr-FR')}`;
}

export function formatResolutionTime(minutes: number): string {
  return `${minutes} min`;
}

export function formatChangeValue(value: number, type: 'up' | 'down' = 'up'): string {
  const prefix = type === 'up' ? '↑' : '↓';
  return `${prefix} ${Math.abs(value)}`;
}
