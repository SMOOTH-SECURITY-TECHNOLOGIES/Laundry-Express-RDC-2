import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { PilotDashboard as AdminPilotDashboard } from '../components/admin/pilot/PilotDashboard';
import { PilotDashboard as LogisticsPilotDashboard } from '../components/pilot/PilotDashboard';
import { buildPilotDashboardSummary } from '../lib/admin/pilot-metrics';
import { pilotConfig } from '../config/pilot';

export const PilotControlCenter: React.FC = () => {
  const { users, orderHistory, supportTickets } = useAppContext();

  const summary = useMemo(
    () =>
      buildPilotDashboardSummary({
        users,
        orders: orderHistory,
        supportTickets,
      }),
    [users, orderHistory, supportTickets],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
        Mode pilote {pilotConfig.isPilotMode ? 'actif' : 'inactif'} — {pilotConfig.paymentModeLabel}
      </div>
      <AdminPilotDashboard summary={summary} />
      <section className="rounded-2xl border border-surface-border bg-surface-card p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-black text-content-primary">Instrumentation logistique terrain</h3>
        <LogisticsPilotDashboard />
      </section>
    </div>
  );
};

export default PilotControlCenter;
