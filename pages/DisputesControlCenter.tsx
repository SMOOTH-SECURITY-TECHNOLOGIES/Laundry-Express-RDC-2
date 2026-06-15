import React, { useState, useCallback, useEffect } from 'react';
import { DisputesHeader } from '../components/admin/disputes/DisputesHeader';
import { DisputeKpiCards } from '../components/admin/disputes/DisputeKpiCards';
import { DisputeFilters } from '../components/admin/disputes/DisputeFilters';
import { DisputeTable } from '../components/admin/disputes/DisputeTable';
import { DisputeBreakdownChart } from '../components/admin/disputes/DisputeBreakdownChart';
import { DisputeStatusAmounts } from '../components/admin/disputes/DisputeStatusAmounts';
import { RefundTrendChart } from '../components/admin/disputes/RefundTrendChart';
import { PartnerRefundRanking } from '../components/admin/disputes/PartnerRefundRanking';
import { RootCausesCard } from '../components/admin/disputes/RootCausesCard';
import { DisputeQuickActions } from '../components/admin/disputes/DisputeQuickActions';
import { DisputeActivityFeed } from '../components/admin/disputes/DisputeActivityFeed';
import { DisputeSlaCard } from '../components/admin/disputes/DisputeSlaCard';
import { DisputeFinancialImpact } from '../components/admin/disputes/DisputeFinancialImpact';
import { DisputeAnomaliesCard } from '../components/admin/disputes/DisputeAnomaliesCard';
import { PlatformProtectionCard } from '../components/admin/disputes/PlatformProtectionCard';
import { DisputeDetailDrawer } from '../components/admin/disputes/DisputeDetailDrawer';
import { CreateDisputeModal, type CreateDisputeFormData } from '../components/admin/disputes/CreateDisputeModal';
import { ApproveRefundModal, type ApproveRefundFormData } from '../components/admin/disputes/ApproveRefundModal';
import { RejectRefundModal, type RejectRefundFormData } from '../components/admin/disputes/RejectRefundModal';
import { AuditDisputesModal } from '../components/admin/disputes/AuditDisputesModal';
import { useAdminDisputes } from '../hooks/useAdminDisputes';
import { Icon } from '../components/Icon';
import type { DisputeRequest } from '../lib/admin/disputes-types';

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />
        ))}
      </div>
      <div className="h-20 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6 h-96 bg-white rounded-2xl border animate-pulse" />
        <div className="lg:col-span-2 h-96 bg-white rounded-2xl border animate-pulse" />
        <div className="lg:col-span-2 h-96 bg-white rounded-2xl border animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-72 bg-white rounded-2xl border animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="warning" className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Impossible de charger les litiges.</h2>
        <p className="text-sm text-gray-500 mb-6">
          Une erreur est survenue lors du chargement des données.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Icon name="arrow-path" className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}

function EmptyRequestsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Icon name="document-text" className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande de remboursement trouvée.</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        Les demandes apparaîtront ici dès qu&apos;un client ou un administrateur ouvre un litige.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
      >
        <Icon name="plus" className="w-4 h-4" />
        Créer une demande manuelle
      </button>
    </div>
  );
}

export const DisputesControlCenter: React.FC = () => {
  const {
    requests,
    loading,
    error,
    refresh,
    summary,
    filters,
    setFilters,
    resetFilters,
    partnerOptions,
    rootCauses,
    activity,
    sla,
    financial,
    anomalies,
    protection,
    breakdown,
    statusAmounts,
    trend,
    partners,
    readOnly,
    degraded,
    createDispute,
    approveDispute,
    rejectDispute,
    investigateDispute,
    exportDisputes,
    auditDisputes,
    openDispute,
    openOrderTruth,
  } = useAdminDisputes();

  const [selectedDispute, setSelectedDispute] = useState<DisputeRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [actionTarget, setActionTarget] = useState<DisputeRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setFilters({ ...filters, search: value });
  }, [filters, setFilters]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleExport = useCallback(async () => {
    const result = await exportDisputes();
    setToast(`Export généré — ${result.count} litiges`);
  }, [exportDisputes]);

  const handleView = useCallback((id: string) => {
    const dispute = requests.find((r) => r.id === id) ?? null;
    if (dispute) {
      openDispute(id);
      setSelectedDispute(dispute);
      setDrawerOpen(true);
    }
  }, [requests, openDispute]);

  const handleApproveClick = useCallback((id: string) => {
    if (readOnly) {
      setToast('Les actions de résolution seront activées lorsque les contrats API seront alignés.');
      return;
    }
    const dispute = requests.find((r) => r.id === id) ?? null;
    setActionTarget(dispute);
    setShowApprove(true);
  }, [requests, readOnly]);

  const handleRejectClick = useCallback((id: string) => {
    if (readOnly) {
      setToast('Les actions de résolution seront activées lorsque les contrats API seront alignés.');
      return;
    }
    const dispute = requests.find((r) => r.id === id) ?? null;
    setActionTarget(dispute);
    setShowReject(true);
  }, [requests, readOnly]);

  const handleCreateSubmit = useCallback(async (data: CreateDisputeFormData) => {
    if (readOnly) {
      setToast('Les actions de résolution seront activées lorsque les contrats API seront alignés.');
      return;
    }
    try {
      await createDispute({
        orderId: data.orderId,
        clientName: data.clientName,
        type: data.type,
        amount: data.amount,
        reason: data.reason,
        priority: data.priority === 'critical' ? 'critical' : data.priority === 'high' ? 'major' : data.priority === 'medium' ? 'medium' : 'low',
      });
      setShowCreate(false);
      setToast('Demande créée avec succès');
    } catch {
      setToast('Les actions de résolution seront activées lorsque les contrats API seront alignés.');
    }
  }, [createDispute, readOnly]);

  const handleApproveSubmit = useCallback(async (data: ApproveRefundFormData) => {
    if (!actionTarget) return;
    try {
      await approveDispute(actionTarget.id, data);
      setShowApprove(false);
      setDrawerOpen(false);
      setToast(`Remboursement approuvé — ${actionTarget.id}`);
    } catch {
      setToast('Les actions de résolution seront activées lorsque les contrats API seront alignés.');
    }
  }, [actionTarget, approveDispute]);

  const handleRejectSubmit = useCallback(async (data: RejectRefundFormData) => {
    if (!actionTarget) return;
    try {
      await rejectDispute(actionTarget.id, data);
      setShowReject(false);
      setDrawerOpen(false);
      setToast(`Litige rejeté — ${actionTarget.id}`);
    } catch {
      setToast('Les actions de résolution seront activées lorsque les contrats API seront alignés.');
    }
  }, [actionTarget, rejectDispute]);

  const handleInvestigate = useCallback((id: string) => {
    openDispute(id);
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
  }, [openDispute]);

  const handleOrderTruth = useCallback((orderId: string) => {
    openOrderTruth(orderId);
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Order Truth' }));
  }, [openOrderTruth]);

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'create':
        setShowCreate(true);
        break;
      case 'critical':
        setFilters({ ...filters, severity: 'critical' });
        break;
      case 'investigate_anomalies':
        window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
        break;
      case 'audit':
        setShowAudit(true);
        break;
      case 'export':
        handleExport();
        break;
      case 'settings':
        setToast('Paramètres litiges — bientôt disponible');
        break;
      default:
        break;
    }
  }, [filters, setFilters, handleExport]);

  const handleAuditSubmit = useCallback(async (payload: Parameters<typeof auditDisputes>[0]) => {
    const result = await auditDisputes(payload);
    setToast(`Audit lancé — ${result.auditId}`);
  }, [auditDisputes]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const runRefresh = () => handleRefresh();
    window.addEventListener('admin-disputes-refresh', runRefresh);
    return () => window.removeEventListener('admin-disputes-refresh', runRefresh);
  }, [handleRefresh]);

  if (loading && !summary) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={handleRefresh} />;

  return (
    <div className="space-y-5">
        {degraded && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <Icon name="warning" className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Mode dégradé : affichage des dernières données disponibles.
            </p>
          </div>
        )}

        <DisputesHeader
          search={filters.search}
          onSearchChange={handleSearchChange}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onCreatePromotion={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))}
          onAddPartner={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))}
          onNewManualRequest={() => setShowCreate(true)}
          readOnly={readOnly}
        />

        {summary && <DisputeKpiCards summary={summary} />}

        <DisputeFilters
          filters={filters}
          partnerOptions={partnerOptions}
          onChange={setFilters}
          onReset={resetFilters}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8">
            {requests.length === 0 ? (
              <EmptyRequestsState onCreate={() => setShowCreate(true)} />
            ) : (
              <DisputeTable
                requests={requests}
                totalCount={summary?.totalRequests}
                onApprove={handleApproveClick}
                onReject={handleRejectClick}
                onView={handleView}
                onInvestigate={handleInvestigate}
                onOrderTruth={handleOrderTruth}
                readOnly={readOnly}
              />
            )}
          </div>
          <div className="xl:col-span-4 space-y-5">
            <ChartCard title="Répartition par type de demande">
              <DisputeBreakdownChart items={breakdown} />
            </ChartCard>
            <ChartCard title="Montants par statut">
              <DisputeStatusAmounts items={statusAmounts} />
            </ChartCard>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ChartCard title="Évolution des montants remboursés" subtitle="30 derniers jours">
            <div className="mb-3 flex items-baseline gap-3">
              <span className="text-xl font-bold text-gray-900">1 738 $</span>
              <span className="text-sm font-medium text-green-600">+20%</span>
            </div>
            <RefundTrendChart data={trend} />
          </ChartCard>
          <ChartCard title="Top partenaires par remboursements">
            <PartnerRefundRanking partners={partners} />
            <button type="button" className="mt-4 text-sm font-semibold text-blue-600 hover:underline">
              Voir tous les partenaires
            </button>
          </ChartCard>
          <ChartCard title="Causes principales">
            <RootCausesCard causes={rootCauses} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4">
            <DisputeQuickActions onAction={handleQuickAction} readOnly={readOnly} />
          </div>
          <div className="lg:col-span-8">
            <DisputeActivityFeed events={activity} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {sla && <DisputeSlaCard sla={sla} />}
          {financial && <DisputeFinancialImpact impact={financial} />}
          <DisputeAnomaliesCard
            anomalies={anomalies}
            onViewAll={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Anomalies' }))}
          />
          {protection && (
            <PlatformProtectionCard
              protection={protection}
              onSettings={() => setToast('Paramètres litiges — bientôt disponible')}
            />
          )}
        </div>

      <DisputeDetailDrawer
        isOpen={drawerOpen}
        dispute={selectedDispute}
        onClose={() => { setDrawerOpen(false); setSelectedDispute(null); }}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
        readOnly={readOnly}
      />

      <CreateDisputeModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateSubmit}
      />

      <ApproveRefundModal
        isOpen={showApprove}
        dispute={actionTarget}
        onClose={() => setShowApprove(false)}
        onSubmit={handleApproveSubmit}
      />

      <RejectRefundModal
        isOpen={showReject}
        dispute={actionTarget}
        onClose={() => setShowReject(false)}
        onSubmit={handleRejectSubmit}
      />

      <AuditDisputesModal
        isOpen={showAudit}
        onClose={() => setShowAudit(false)}
        onSubmit={handleAuditSubmit}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {toast}
        </div>
      )}
    </div>
  );
};
