import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useSupportCenter from '../hooks/useSupportCenter';
import { SupportHeader } from '../components/admin/support/SupportHeader';
import { SupportFilters } from '../components/admin/support/SupportFilters';
import { SupportKpiCards } from '../components/admin/support/SupportKpiCards';
import { SupportTicketTable } from '../components/admin/support/SupportTicketTable';
import { SupportSlaCard } from '../components/admin/support/SupportSlaCard';
import { SupportQueueKanban } from '../components/admin/support/SupportQueueKanban';
import { SupportTrendChart } from '../components/admin/support/SupportTrendChart';
import { SupportChannelDonut } from '../components/admin/support/SupportChannelDonut';
import { SupportSentimentChart } from '../components/admin/support/SupportSentimentChart';
import { SupportTopIssues } from '../components/admin/support/SupportTopIssues';
import { SupportAgentPerformance } from '../components/admin/support/SupportAgentPerformance';
import { SupportAiTriage } from '../components/admin/support/SupportAiTriage';
import { SupportEscalationCenter } from '../components/admin/support/SupportEscalationCenter';
import { SupportQuickActions } from '../components/admin/support/SupportQuickActions';
import { SupportTicketDrawer } from '../components/admin/support/SupportTicketDrawer';
import { trackSupportEvent } from '../lib/admin/support-api';
import type { SupportTicket, TicketDetail } from '../lib/admin/support-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger le centre support.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed p-12 text-center">
      <Icon name="lifebuoy" className="w-10 h-10 text-gray-300 mx-auto mb-4" />
      <p className="text-sm font-medium">Aucun ticket de support.</p>
      <p className="text-xs text-gray-500 mt-2">Les tickets apparaîtront ici lorsque les clients contacteront le support.</p>
    </div>
  );
}

export const SupportControlCenter: React.FC = () => {
  const {
    kpis, tickets, sla, queue, aiTriage, sentiment, topIssues, agents,
    escalations, trends, channels, loading, error, days, refresh,
    handleExport, handleTicketDetail, handleReply, handleEscalate, handleResolve, handleCreateTicket,
  } = useSupportCenter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackSupportEvent('admin_support_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filtered = useMemo(() => {
    let list = tickets;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.clientName.toLowerCase().includes(q) || t.ticketCode.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter((t) => t.priority === priorityFilter);
    if (categoryFilter !== 'all') list = list.filter((t) => t.category === categoryFilter);
    if (channelFilter !== 'all') list = list.filter((t) => t.channel === channelFilter);
    if (slaFilter !== 'all') list = list.filter((t) => t.slaStatus === slaFilter);
    return list;
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter, channelFilter, slaFilter]);

  const onFilter = useCallback((type: string, value: string) => {
    trackSupportEvent('support_filter_changed', { type, value });
    if (type === 'status') setStatusFilter(value);
    if (type === 'priority') setPriorityFilter(value);
    if (type === 'category') setCategoryFilter(value);
    if (type === 'agent') setAgentFilter(value);
    if (type === 'channel') setChannelFilter(value);
    if (type === 'partner') setPartnerFilter(value);
    if (type === 'sla') setSlaFilter(value);
  }, []);

  const openTicket = useCallback(async (t: SupportTicket) => {
    setDrawerLoading(true);
    setDetail(null);
    trackSupportEvent('ticket_opened', { ticketId: t.id });
    try {
      setDetail(await handleTicketDetail(t.id));
    } catch {
      setToast('Impossible de charger le ticket');
    } finally {
      setDrawerLoading(false);
    }
  }, [handleTicketDetail]);

  const onExport = useCallback(async () => {
    try {
      const r = await handleExport('csv');
      trackSupportEvent('support_exported', { filename: r.filename });
      setToast(`Export — ${r.filename} (${r.count} lignes)`);
    } catch {
      setToast('Export impossible');
    }
  }, [handleExport]);

  const onNewTicket = useCallback(async () => {
    try {
      await handleCreateTicket({ title: 'Nouveau ticket', description: 'Description à compléter', category: 'other', priority: 'medium' });
      trackSupportEvent('ticket_created');
      setToast('Ticket créé');
      await refresh();
    } catch {
      setToast('Création impossible');
    }
  }, [handleCreateTicket, refresh]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <SupportHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onExport={onExport} onNewTicket={onNewTicket} />
      <SupportFilters statusFilter={statusFilter} priorityFilter={priorityFilter} categoryFilter={categoryFilter} agentFilter={agentFilter} channelFilter={channelFilter} partnerFilter={partnerFilter} slaFilter={slaFilter} onFilter={onFilter} />
      {kpis && <SupportKpiCards kpis={kpis} />}
      {tickets.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <SupportTicketTable tickets={filtered} onView={openTicket} />
              <SupportTrendChart data={trends} days={days} onDaysChange={(d) => refresh(d)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SupportTopIssues issues={topIssues} />
                <SupportAgentPerformance agents={agents} />
              </div>
            </div>
            <div className="space-y-6">
              {sla && <SupportSlaCard sla={sla} days={days} onDaysChange={(d) => refresh(d)} />}
              <SupportQueueKanban queue={queue} />
              <SupportChannelDonut channels={channels} />
              <SupportSentimentChart data={sentiment} />
              <SupportQuickActions onNewTicket={onNewTicket} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SupportAiTriage items={aiTriage} />
            <SupportEscalationCenter items={escalations} />
          </div>
        </>
      )}
      {(detail || drawerLoading) && (
        <SupportTicketDrawer
          ticket={detail}
          loading={drawerLoading && !detail}
          onClose={() => setDetail(null)}
          onReply={async (c) => { if (!detail) return; try { await handleReply(detail.id, c); setToast('Réponse envoyée'); } catch { setToast('Réponse impossible'); } }}
          onEscalate={async () => { if (!detail) return; try { await handleEscalate(detail.id); setToast('Ticket escaladé'); setDetail(null); refresh(); } catch { setToast('Escalade impossible'); } }}
          onResolve={async () => { if (!detail) return; try { await handleResolve(detail.id); trackSupportEvent('ticket_resolved'); setToast('Ticket résolu'); setDetail(null); refresh(); } catch { setToast('Résolution impossible'); } }}
        />
      )}
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}
    </div>
  );
};
