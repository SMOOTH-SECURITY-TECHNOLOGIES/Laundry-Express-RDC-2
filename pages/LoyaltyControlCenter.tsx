import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useLoyaltyCenter from '../hooks/useLoyaltyCenter';
import { LoyaltyHeader } from '../components/admin/loyalty/LoyaltyHeader';
import { LoyaltyKpiCards } from '../components/admin/loyalty/LoyaltyKpiCards';
import { LoyaltyHealthCard } from '../components/admin/loyalty/LoyaltyHealthCard';
import { LoyaltySettingsCard } from '../components/admin/loyalty/LoyaltySettingsCard';
import { RevenueImpactCard } from '../components/admin/loyalty/RevenueImpactCard';
import { RewardsCatalogTable } from '../components/admin/loyalty/RewardsCatalogTable';
import { EarningRulesTable } from '../components/admin/loyalty/EarningRulesTable';
import { LoyaltyActivityTable } from '../components/admin/loyalty/LoyaltyActivityTable';
import { TopLoyaltyUsers } from '../components/admin/loyalty/TopLoyaltyUsers';
import { TopRedeemers } from '../components/admin/loyalty/TopRedeemers';
import { RetentionChart } from '../components/admin/loyalty/RetentionChart';
import { LoyaltyCohortTable } from '../components/admin/loyalty/LoyaltyCohortTable';
import { LoyaltyRiskCenter } from '../components/admin/loyalty/LoyaltyRiskCenter';
import { LoyaltySegmentsCard } from '../components/admin/loyalty/LoyaltySegmentsCard';
import { LoyaltyIntegrationsCard } from '../components/admin/loyalty/LoyaltyIntegrationsCard';
import { CreateRewardModal } from '../components/admin/loyalty/CreateRewardModal';
import { LoyaltyExportCenter } from '../components/admin/loyalty/LoyaltyExportCenter';
import type { LoyaltySettingsCard as Settings } from '../lib/admin/loyalty-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 space-y-6">
      <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />)}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger le Loyalty & Retention Center.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const LoyaltyControlCenter: React.FC = () => {
  const {
    kpis, health, settings, rewards, earningRules, activity, topUsers, topRedeemers,
    retention, revenueImpact, cohorts, risks, segments, integrations,
    loading, error, source, refresh,
    handleSaveSettings, handleRunExpiration, handleCreateReward, handleDisableReward, handleExport,
  } = useLoyaltyCenter();

  const [search, setSearch] = useState('');
  const [draftSettings, setDraftSettings] = useState<Settings | null>(null);
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runningExpiry, setRunningExpiry] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setDraftSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredActivity = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return activity;
    return activity.filter((a) =>
      a.clientName.toLowerCase().includes(q) ||
      a.clientEmail.toLowerCase().includes(q) ||
      (a.orderNumber || '').toLowerCase().includes(q),
    );
  }, [activity, search]);

  const onSave = useCallback(async () => {
    if (!draftSettings) return;
    setSaving(true);
    try {
      await handleSaveSettings(draftSettings);
      setToast('Paramètres enregistrés');
    } catch {
      setToast('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }, [draftSettings, handleSaveSettings]);

  const onRunExpiry = useCallback(async () => {
    setRunningExpiry(true);
    try {
      const r = await handleRunExpiration();
      setToast(`${r.expiredPoints} points expirés`);
    } catch {
      setToast('Expiration échouée');
    } finally {
      setRunningExpiry(false);
    }
  }, [handleRunExpiration]);

  const onCreateReward = useCallback(async (name: string, pts: number, val: number) => {
    try {
      const r = await handleCreateReward(name, pts, val);
      setToast(`Récompense créée (${r.id})`);
    } catch {
      setToast('Création récompense impossible');
    }
  }, [handleCreateReward]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;
  if (!kpis || !health || !draftSettings || !revenueImpact) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-900/20 px-4 py-3 text-sm font-medium text-purple-800 dark:text-purple-200">{toast}</div>}
        {source === 'backend' && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 px-4 py-2 text-xs font-medium text-green-800 flex items-center gap-2">
            <Icon name="check" className="w-3.5 h-3.5" /> Données 100% backend — Loyalty & Retention Center
          </div>
        )}

        <LoyaltyHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => refresh()}
          onExport={() => setShowExport(true)}
          onCreateReward={() => setShowCreateReward(true)}
        />

        <LoyaltyKpiCards kpis={kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <LoyaltyHealthCard health={health} />
          <LoyaltySettingsCard
            settings={draftSettings}
            onChange={setDraftSettings}
            onSave={onSave}
            onRunExpiration={onRunExpiry}
            saving={saving}
            runningExpiry={runningExpiry}
          />
          <RevenueImpactCard data={revenueImpact} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RewardsCatalogTable rewards={rewards} onDisable={handleDisableReward} />
          <EarningRulesTable rules={earningRules} />
        </div>

        <LoyaltyActivityTable activity={filteredActivity} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TopLoyaltyUsers users={topUsers} />
          <TopRedeemers redeemers={topRedeemers} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RetentionChart data={retention} />
          <LoyaltyCohortTable cohorts={cohorts} />
          <LoyaltyRiskCenter risks={risks} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <LoyaltySegmentsCard segments={segments} />
          <LoyaltyIntegrationsCard integrations={integrations} />
        </div>
      </div>
      <CreateRewardModal open={showCreateReward} onClose={() => setShowCreateReward(false)} onCreate={onCreateReward} />
      <LoyaltyExportCenter
        open={showExport}
        onClose={() => setShowExport(false)}
        onExport={async (format, scope) => {
          const r = await handleExport(format, scope);
          setToast(`Export ${scope} — ${r.filename} (${r.count} lignes)`);
        }}
      />
    </div>
  );
};
