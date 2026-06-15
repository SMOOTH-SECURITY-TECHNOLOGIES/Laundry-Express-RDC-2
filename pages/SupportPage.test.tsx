// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const mockBundle = {
  kpis: {
    openTickets: 24, openTicketsChange: -14.3, openTicketsSparkline: [26, 24],
    newTickets: 12, newTicketsChange: 20, newTicketsSparkline: [10, 12],
    waitingClient: 8, waitingClientChange: -11.1, waitingClientSparkline: [9, 8],
    waitingSupport: 6, waitingSupportChange: -25, waitingSupportSparkline: [8, 6],
    slaCompliance: 92, slaComplianceChange: 2.2, slaComplianceSparkline: [90, 92],
    criticalTickets: 3, criticalTicketsChange: 50, criticalTicketsSparkline: [2, 3],
    satisfaction: 4.6, satisfactionChange: 0.3, satisfactionSparkline: [4.3, 4.6],
    avgResponseMinutes: 18, avgResponseChange: -4, avgResponseSparkline: [22, 18],
  },
  tickets: [{ id: '1', ticketCode: 'TK-2401', title: 'Retard livraison', aiSummary: 'Client signale retard', clientName: 'Jean', clientId: 'u1', category: 'delivery', categoryLabel: 'Livraison', priority: 'high', priorityLabel: 'High', status: 'open', statusLabel: 'Ouvert', slaLabel: 'Dans SLA', slaStatus: 'within', slaMinutesRemaining: 120, updatedAt: '2026-06-07', agentName: 'Marie', channel: 'whatsapp' }],
  sla: { withinSla: 18, atRisk: 4, breached: 2, avgResolutionMinutes: 142, compliancePercent: 92 },
  queue: [], aiTriage: [], sentiment: [], topIssues: [], agents: [], escalations: [], trends: [], channels: [],
  loading: false, error: null, source: 'backend', days: 7,
  refresh: vi.fn(), handleExport: vi.fn(), handleTicketDetail: vi.fn(),
  handleReply: vi.fn(), handleAssign: vi.fn(), handleEscalate: vi.fn(), handleResolve: vi.fn(), handleCreateTicket: vi.fn(),
};

vi.mock('../lib/admin/support-api', () => ({ trackSupportEvent: vi.fn(), SUPPORT_WRITE_ENABLED: true }));
vi.mock('../hooks/useSupportCenter', () => ({ default: () => mockBundle }));

import { SupportControlCenter } from './SupportControlCenter';

describe('SupportPage', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders Support Operations Center header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<SupportControlCenter />); });
    expect(container.textContent).toContain('Support Operations Center');
    expect(container.textContent).toContain('Tickets ouverts');
    root.unmount();
    container.remove();
  });
});
