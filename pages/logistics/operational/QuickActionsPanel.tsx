import React from 'react';
import { logisticsCard } from '../logistics-ui';
import type { NavigateHandler } from './useOperationalDashboard';

const ACTIONS: Array<{
  label: string;
  target: string;
  apiRequired?: boolean;
}> = [
  { label: 'Voir anomalies', target: 'alerts' },
  { label: 'Missions bloquées', target: 'missions' },
  { label: 'Chauffeurs indisponibles', target: 'drivers' },
  { label: 'Tickets ouverts', target: 'reports' },
  { label: 'Paiements échoués', target: 'reports', apiRequired: true },
  { label: 'Exporter rapport', target: 'reports', apiRequired: true },
];

export const QuickActionsPanel: React.FC<{ onNavigate?: NavigateHandler }> = ({ onNavigate }) => (
    <section className={`${logisticsCard} p-4`}>
        <h3 className="font-black text-content-primary">Actions rapides</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => {
            if (!action.apiRequired) onNavigate?.(action.target);
          }}
          disabled={action.apiRequired}
          title={action.apiRequired ? 'Module en attente de branchement opérationnel' : undefined}
          className={`min-h-11 rounded-xl border border-surface-border-subtle px-4 text-left text-sm font-black ${
            action.apiRequired
              ? 'cursor-not-allowed bg-surface-muted text-content-muted'
              : 'text-content-primary hover:bg-surface-muted'
          }`}
        >
          <span className="block">{action.label}</span>
          {action.apiRequired && <span className="mt-1 block text-[10px] font-bold uppercase text-content-muted">Module indisponible</span>}
        </button>
      ))}
    </div>
  </section>
);
