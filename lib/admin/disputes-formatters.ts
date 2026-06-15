import { DisputeStatus, DisputeType, DisputeSeverity } from './disputes-types';

const statusLabels: Record<DisputeStatus, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  under_review: 'En cours',
  escalated: 'Escaladée',
  closed: 'Fermée',
  resolved: 'Résolu',
};

const typeLabels: Record<DisputeType, string> = {
  quality: 'Qualité',
  delay: 'Retard',
  cancellation: 'Annulation',
  missing_item: 'Article manquant',
  payment: 'Paiement',
  damaged_item: 'Endommagé',
  duplicate_payment: 'Doublon',
  other: 'Autre',
};

const statusBadgeColor: Record<DisputeStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  under_review: 'bg-purple-100 text-purple-700',
  escalated: 'bg-orange-100 text-orange-700',
  closed: 'bg-gray-100 text-gray-600',
  resolved: 'bg-gray-100 text-gray-600',
};

const typeBadgeColor: Record<DisputeType, string> = {
  quality: 'bg-blue-100 text-blue-700',
  delay: 'bg-yellow-100 text-yellow-700',
  cancellation: 'bg-purple-100 text-purple-700',
  missing_item: 'bg-green-100 text-green-700',
  payment: 'bg-red-100 text-red-700',
  damaged_item: 'bg-orange-100 text-orange-700',
  duplicate_payment: 'bg-rose-100 text-rose-700',
  other: 'bg-gray-100 text-gray-700',
};

export function getStatusLabel(status: DisputeStatus): string {
  return statusLabels[status] ?? status;
}

export function getTypeLabel(type: DisputeType): string {
  return typeLabels[type] ?? type;
}

export function getStatusBadgeColor(status: DisputeStatus): string {
  return statusBadgeColor[status] ?? 'bg-gray-100 text-gray-600';
}

export function getTypeBadgeColor(type: DisputeType): string {
  return typeBadgeColor[type] ?? 'bg-gray-100 text-gray-600';
}

export function formatCurrency(amount: number, currency: 'USD' | 'CDF' = 'USD'): string {
  const formatted = amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === 'USD' ? `${formatted} $` : `${formatted} FC`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'À l\'instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return formatDateTime(isoString);
}

export function disputeStatusToBadge(status: DisputeStatus): { label: string; color: string } {
  const map: Record<DisputeStatus, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    under_review: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
    approved: { label: 'Approuvée', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-800' },
    resolved: { label: 'Résolu', color: 'bg-gray-100 text-gray-800' },
    escalated: { label: 'Escaladée', color: 'bg-purple-100 text-purple-800' },
    in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
    closed: { label: 'Fermée', color: 'bg-gray-100 text-gray-800' },
  };
  return map[status] ?? { label: status, color: 'bg-gray-100 text-gray-800' };
}

export function disputeTypeToBadge(type: DisputeType): { label: string; color: string } {
  const map: Record<DisputeType, { label: string; color: string }> = {
    quality: { label: 'Qualité', color: 'bg-blue-100 text-blue-800' },
    delay: { label: 'Retard', color: 'bg-yellow-100 text-yellow-800' },
    cancellation: { label: 'Annulation', color: 'bg-purple-100 text-purple-800' },
    missing_item: { label: 'Article manquant', color: 'bg-green-100 text-green-800' },
    payment: { label: 'Paiement', color: 'bg-red-100 text-red-800' },
    damaged_item: { label: 'Endommagé', color: 'bg-orange-100 text-orange-800' },
    duplicate_payment: { label: 'Doublon', color: 'bg-rose-100 text-rose-800' },
    other: { label: 'Autre', color: 'bg-gray-100 text-gray-800' },
  };
  return map[type] ?? { label: type, color: 'bg-gray-100 text-gray-800' };
}

export function severityToBadge(severity: DisputeSeverity): { label: string; color: string } {
  const map: Record<DisputeSeverity, { label: string; color: string }> = {
    critical: { label: 'Critique', color: 'bg-red-100 text-red-800' },
    major: { label: 'Majeure', color: 'bg-orange-100 text-orange-800' },
    medium: { label: 'Moyen', color: 'bg-yellow-100 text-yellow-800' },
    low: { label: 'Faible', color: 'bg-green-100 text-green-800' },
  };
  return map[severity] ?? { label: severity, color: 'bg-gray-100 text-gray-800' };
}

export function amountToRiskLevel(amount: number): { label: string; color: string } {
  if (amount >= 200) return { label: 'Élevé', color: 'text-red-600' };
  if (amount >= 100) return { label: 'Moyen', color: 'text-yellow-600' };
  return { label: 'Faible', color: 'text-green-600' };
}
