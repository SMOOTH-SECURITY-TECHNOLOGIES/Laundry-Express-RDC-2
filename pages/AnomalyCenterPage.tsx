import React, { useState } from 'react';
import { useAnomalyCenter } from '../hooks/useAnomalyCenter';
import { Icon } from '../components/Icon';
import SystemHealthStrip from '../components/admin/anomalies/SystemHealthStrip';
import AnomalySummaryCards from '../components/admin/anomalies/AnomalySummaryCards';
import ImpactedCorridors from '../components/admin/anomalies/ImpactedCorridors';
import AnomalyFilters from '../components/admin/anomalies/AnomalyFilters';
import AnomalyList from '../components/admin/anomalies/AnomalyList';
import RevenueLeakageCard from '../components/admin/anomalies/RevenueLeakageCard';
import AnomalyActivityFeed from '../components/admin/anomalies/AnomalyActivityFeed';
import { AnomalyQuickActions } from '../components/admin/anomalies/AnomalyQuickActions';
import { CreateInvestigationModal } from '../components/admin/anomalies/CreateInvestigationModal';
import { ResolveAnomalyModal } from '../components/admin/anomalies/ResolveAnomalyModal';
import { AuditRunModal } from '../components/admin/anomalies/AuditRunModal';

export const AnomalyCenterPage: React.FC = () => {
  const {
    summary, systemHealth, corridors, anomalies, totalAnomalies,
    revenueLeakage, activityFeed, filters, loading, error, selectedCorridor,
    setFilters, setSelectedCorridor,
    investigate, createTicket, resolve, createInvestigation, runAudit, exportReport, refresh,
  } = useAnomalyCenter();

  const [showCreateInv, setShowCreateInv] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  const handleCorridorSelect = (c: string) => {
    setSelectedCorridor(c === selectedCorridor ? 'all' : c);
    setFilters({ ...filters, corridor: c === selectedCorridor ? 'all' : c });
  };

  const totalLeakage = revenueLeakage.reduce((s, i) => s + i.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-2xl" />
        <div className="h-20 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}</div>
        <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}</div>
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl">
        <div className="flex items-center gap-3">
          <Icon name="warning" className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-bold text-red-700">{error}</h3>
            <button onClick={refresh} className="mt-2 text-sm font-semibold text-red-600 hover:underline">Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Anomaly Center</h1>
          <p className="text-sm text-gray-500 mt-1">Détection temps réel des violations opérationnelles et corridors de vérité dégradés.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Icon name="arrow-path" className="w-4 h-4" /> Actualiser
          </button>
          <button onClick={() => setShowAudit(true)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Icon name="shield-check" className="w-4 h-4" /> Audit complet
          </button>
          <button onClick={exportReport} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter CSV
          </button>
          <button onClick={() => setShowCreateInv(true)} className="px-4 py-2 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-blue-600 flex items-center gap-2">
            <Icon name="plus" className="w-4 h-4" /> Créer investigation
          </button>
        </div>
      </div>

      {/* System Health */}
      {summary && <SystemHealthStrip items={systemHealth} />}

      {/* KPI Summary */}
      {summary && <AnomalySummaryCards summary={summary} />}

      {/* Corridors + Revenue + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ImpactedCorridors corridors={corridors} selectedCorridor={selectedCorridor} onSelect={handleCorridorSelect} />
        </div>
        <div className="lg:col-span-1">
          <RevenueLeakageCard items={revenueLeakage} total={totalLeakage} />
        </div>
        <div className="lg:col-span-1">
          <AnomalyActivityFeed events={activityFeed} />
        </div>
      </div>

      {/* Filters */}
      <AnomalyFilters filters={filters} onChange={setFilters} onReset={() => setFilters({ severity: 'all', corridor: 'all', date: '', partner: 'all', driver: 'all', zone: 'all', status: 'all', search: '' })} />

      {/* Anomaly List + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnomalyList
            anomalies={anomalies}
            total={totalAnomalies}
            onInvestigate={investigate}
            onTicket={createTicket}
            onResolve={(id) => { setResolveId(id); setShowResolve(true); }}
          />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <AnomalyQuickActions />
        </div>
      </div>

      {/* Modals */}
      <CreateInvestigationModal
        isOpen={showCreateInv}
        onClose={() => setShowCreateInv(false)}
        onSubmit={(p) => { createInvestigation(p); setShowCreateInv(false); }}
      />
      <ResolveAnomalyModal
        isOpen={showResolve}
        anomalyId={resolveId}
        onClose={() => { setShowResolve(false); setResolveId(null); }}
        onSubmit={(id, p) => { resolve(id, p); setShowResolve(false); setResolveId(null); }}
      />
      <AuditRunModal
        isOpen={showAudit}
        onClose={() => setShowAudit(false)}
        onRun={(type) => { runAudit(type); setShowAudit(false); }}
      />
    </div>
  );
};
