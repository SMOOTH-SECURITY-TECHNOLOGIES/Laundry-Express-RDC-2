import React, { useState } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING, STATUS_COLORS, type StatusTone } from '../ui/tokens';
import { BottomSheet } from '../ui/BottomSheet';
import { usePilotMetrics } from '../../hooks/usePilotMetrics';

/* ─── Types ─── */
interface PilotMetrics {
  avgAssignmentTime: number;
  avgPickupTime: number;
  avgDeliveryTime: number;
  completionRate: number;
  incidentCount: number;
  delayCount: number;
  totalMissions: number;
  completedMissions: number;
  failedMissions: number;
  cancelledMissions: number;
  lastUpdated: Date;
}

interface PilotDashboardProps {
  /** Métriques externes (optionnel, sinon utilise le hook interne) */
  metrics?: PilotMetrics;
  /** Callback pour exporter */
  onExport?: (data: string) => void;
  /** Callback pour réinitialiser */
  onReset?: () => void;
}

/* ─── Component ─── */
export const PilotDashboard: React.FC<PilotDashboardProps> = ({
  metrics: externalMetrics,
  onExport,
  onReset,
}) => {
  const hook = usePilotMetrics();
  const metrics = externalMetrics || hook.metrics;
  const [showDetails, setShowDetails] = useState(false);
  const [, forceUpdate] = useState(0);

  const handleRefresh = () => {
    forceUpdate((n) => n + 1);
  };

  const handleExport = () => {
    const data = hook.exportMetrics();
    onExport?.(data);
    // Also download as file
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pilot-metrics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    hook.reset();
    onReset?.();
    forceUpdate((n) => n + 1);
  };

  const kpis = [
    {
      label: 'Assignation',
      value: `${metrics.avgAssignmentTime}`,
      unit: 'min',
      tone: 'info' as const,
      icon: 'user' as const,
    },
    {
      label: 'Pickup',
      value: `${metrics.avgPickupTime}`,
      unit: 'min',
      tone: 'info' as const,
      icon: 'mapPin' as const,
    },
    {
      label: 'Livraison',
      value: `${metrics.avgDeliveryTime}`,
      unit: 'min',
      tone: 'success' as const,
      icon: 'truck' as const,
    },
    {
      label: 'Taux réussite',
      value: `${metrics.completionRate}`,
      unit: '%',
      tone: metrics.completionRate >= 80 ? 'success' : metrics.completionRate >= 50 ? 'warning' : 'danger',
      icon: 'check' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-surface-page pb-24">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface-card/95 backdrop-blur safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className={TYPO.pageTitle}>Pilote</h1>
            <p className={`${TYPO.sectionSubtitle} text-xs`}>Métriques temps réel</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip label="LIVE" tone="success" pulse size="xs" variant="filled" />
            <MobileButton
              label=""
              icon="arrow-path"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onClick={handleRefresh}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* ─── KPIs ─── */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={`${CARD.base} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${STATUS_COLORS[kpi.tone].bg}`}>
                  <Icon name={kpi.icon} className={`h-4 w-4 ${STATUS_COLORS[kpi.tone].text}`} />
                </div>
                <p className="text-xs font-bold text-content-muted">{kpi.label}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black ${STATUS_COLORS[kpi.tone].text}`}>{kpi.value}</span>
                <span className="text-xs text-content-muted">{kpi.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Missions Summary ─── */}
        <div className={`${CARD.base} p-4`}>
          <h3 className={`${TYPO.sectionTitle} mb-3`}>Résumé missions</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total', value: metrics.totalMissions, tone: 'info' as const },
              { label: 'Terminées', value: metrics.completedMissions, tone: 'success' as const },
              { label: 'Échouées', value: metrics.failedMissions, tone: 'danger' as const },
              { label: 'Annulées', value: metrics.cancelledMissions, tone: 'warning' as const },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-xl font-black ${STATUS_COLORS[item.tone].text}`}>{item.value}</p>
                <p className="text-[10px] font-bold text-content-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Incidents & Delays ─── */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`${CARD.base} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="warning" className="h-4 w-4 text-red-500" />
              <p className="text-xs font-bold text-content-muted">Incidents</p>
            </div>
            <p className="text-2xl font-black text-red-600">{metrics.incidentCount}</p>
          </div>
          <div className={`${CARD.base} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="clock" className="h-4 w-4 text-orange-500" />
              <p className="text-xs font-bold text-content-muted">Retards</p>
            </div>
            <p className="text-2xl font-black text-orange-600">{metrics.delayCount}</p>
          </div>
        </div>

        {/* ─── Actions ─── */}
        <div className="grid grid-cols-2 gap-2">
          <MobileButton
            label="Exporter"
            icon="arrow-down-tray"
            variant="secondary"
            size="md"
            onClick={handleExport}
          />
          <MobileButton
            label="Réinitialiser"
            icon="xmark"
            variant="danger"
            size="md"
            onClick={handleReset}
          />
        </div>

        {/* ─── Détails ─── */}
        <MobileButton
          label={showDetails ? 'Masquer les détails' : 'Voir les détails'}
          icon={showDetails ? 'chevron-up' : 'chevron-down'}
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        />

        {showDetails && (
          <div className={`${CARD.base} p-4 space-y-2`}>
            <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
              <span className="text-xs text-content-muted">Dernière mise à jour</span>
              <span className="text-xs font-bold text-content-primary">
                {metrics.lastUpdated.toLocaleTimeString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
              <span className="text-xs text-content-muted">Temps moyen total</span>
              <span className="text-xs font-bold text-content-primary">
                {metrics.avgAssignmentTime + metrics.avgPickupTime + metrics.avgDeliveryTime} min
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
              <span className="text-xs text-content-muted">Taux d'incidents</span>
              <span className="text-xs font-bold text-content-primary">
                {metrics.totalMissions > 0
                  ? `${Math.round((metrics.incidentCount / metrics.totalMissions) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PilotDashboard;
