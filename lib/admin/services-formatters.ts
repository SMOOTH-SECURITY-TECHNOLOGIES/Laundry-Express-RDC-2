export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function formatCurrency(value: number, currency: 'USD' | 'CDF' = 'USD'): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return currency === 'USD' ? `${formatted} $` : `${formatted} FC`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600 bg-green-50';
  if (score >= 75) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export function getAnomalyColor(count: number): string {
  if (count === 0) return 'text-green-600 bg-green-50';
  if (count <= 2) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export function getSlaColor(sla: number): string {
  if (sla >= 95) return 'text-green-600';
  if (sla >= 85) return 'text-yellow-600';
  return 'text-red-600';
}
