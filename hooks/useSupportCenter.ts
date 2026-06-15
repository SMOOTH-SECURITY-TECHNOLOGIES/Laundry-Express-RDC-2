import { useState, useEffect, useCallback } from 'react';
import {
  fetchSupportBundle, invalidateSupportCache, exportSupport, fetchTicketDetail,
} from '../lib/admin/support-api';
import { realApi } from '../services/real-api';
import type {
  SupportKpis, SupportTicket, SlaBreakdown, QueueColumn, AiTriageItem,
  SentimentBreakdown, TopIssue, AgentPerformance, EscalationItem, TrendPoint, ChannelBreakdown,
} from '../lib/admin/support-types';

export default function useSupportCenter(initialDays = 7) {
  const [kpis, setKpis] = useState<SupportKpis | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [sla, setSla] = useState<SlaBreakdown | null>(null);
  const [queue, setQueue] = useState<QueueColumn[]>([]);
  const [aiTriage, setAiTriage] = useState<AiTriageItem[]>([]);
  const [sentiment, setSentiment] = useState<SentimentBreakdown[]>([]);
  const [topIssues, setTopIssues] = useState<TopIssue[]>([]);
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [channels, setChannels] = useState<ChannelBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('backend');
  const [days, setDays] = useState(initialDays);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchSupportBundle>>) => {
    setKpis(bundle.kpis);
    setTickets(bundle.tickets);
    setSla(bundle.sla);
    setQueue(bundle.queue);
    setAiTriage(bundle.aiTriage);
    setSentiment(bundle.sentiment);
    setTopIssues(bundle.topIssues);
    setAgents(bundle.agents);
    setEscalations(bundle.escalations);
    setTrends(bundle.trends);
    setChannels(bundle.channels);
    setSource(bundle.source);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true);
    setError(null);
    try {
      applyBundle(await fetchSupportBundle(d));
    } catch {
      setError('Impossible de charger le centre support.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateSupportCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      setError('Session requise. Reconnectez-vous en tant qu\'administrateur.');
      return;
    }
    loadData(initialDays);
  }, [loadData, initialDays]);

  return {
    kpis, tickets, sla, queue, aiTriage, sentiment, topIssues, agents,
    escalations, trends, channels, loading, error, source, days, refresh,
    handleExport: async (format = 'csv') => exportSupport({ format, scope: 'tickets' }),
    handleTicketDetail: (id: string) => fetchTicketDetail(id),
    handleReply: async (id: string, content: string) => realApi.replySupportTicket(id, content),
    handleAssign: async (id: string, agentId: string) => realApi.assignSupportTicket(id, agentId),
    handleEscalate: async (id: string) => realApi.escalateSupportTicket(id),
    handleResolve: async (id: string) => realApi.resolveSupportTicket(id),
    handleCreateTicket: async (data: { title: string; description: string; category?: string; priority?: string }) =>
      realApi.createSupportTicket(data),
  };
}
