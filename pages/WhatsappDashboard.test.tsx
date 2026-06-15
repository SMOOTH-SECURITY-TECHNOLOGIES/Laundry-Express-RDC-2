// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../hooks/useWhatsappCenter', () => ({
  default: () => ({
    kpis: {
      openConversations: 1284, openConversationsChange: 12.5, openConversationsSparkline: [],
      messagesToday: 12450, messagesTodayChange: 18.7, messagesTodaySparkline: [],
      responseRate: 94.6, responseRateChange: 4.2, responseRateSparkline: [],
      avgResponseTime: '2 min 14 sec', avgResponseTimeChange: '-15 sec', avgResponseTimeSparkline: [],
      activeTemplates: 36, activeTemplatesChange: 3, activeTemplatesSparkline: [],
      costToday: 42.8, costTodayChange: 5.3, costTodaySparkline: [],
      aiConversationsPct: 72, aiConversationsChange: 8, aiConversationsSparkline: [],
      satisfaction: 4.8, satisfactionChange: 0.2, satisfactionSparkline: [],
    },
    conversations: [{ id: '1', clientName: 'Marie', phone: '+243 81 234 5678', channel: 'whatsapp', status: 'open', statusLabel: 'Ouvert', waitTimeSec: 120, waitTimeLabel: '2 min' }],
    liveMonitor: { activeConversations: 124, waitingConversations: 18, slaBreached: 7, escalations: 5, availableAgents: ['Sophie'], aiActivePct: 72, supportBacklog: 18 },
    templates: [], notifications: [], campaigns: [], automations: [], webhooks: [],
    quality: { qualityRating: 'high', qualityLabel: 'High', messagingLimit: '10000/jour', phoneStatus: 'connected', phoneStatusLabel: 'Connected', verificationStatus: 'verified', verificationLabel: 'Verified', alerts: [] },
    aiMetrics: { aiConversationsPct: 72, humanEscalations: 186, aiConfidence: 87, resolutionRate: 68, resolvedWithoutHuman: 924, costSaved: 4200, satisfaction: 4.6 },
    costs: { totalToday: 42.8, totalWeek: 285, totalMonth: 1240, marketingCost: 18, utilityCost: 19, authCost: 5, costPerConversation: 0.033, trend: 5.3, forecast: 1350, sparklineDay: [], sparklineWeek: [], sparklineMonth: [] },
    analytics: [], segments: [],
    sla: { firstResponseAvg: '2 min', resolutionAvg: '18 min', openConversations: 1284, slaBreached: 7, firstResponseStatus: 'green', resolutionStatus: 'green', openStatus: 'orange', breachedStatus: 'red' },
    loading: false, error: null, refresh: vi.fn(), handleExport: vi.fn(), handleTestWebhook: vi.fn(), handleSend: vi.fn(),
  }),
}));

import { WhatsappControlCenter } from './WhatsappControlCenter';

describe('WhatsappControlCenter', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders whatsapp business center header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<WhatsappControlCenter />); });
    expect(container.textContent).toContain('WhatsApp Business Center');
    await act(async () => root.unmount());
    container.remove();
  });
});
