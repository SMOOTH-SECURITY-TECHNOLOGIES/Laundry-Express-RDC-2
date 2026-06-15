import React from 'react';

const statuses = [
  { label: 'API', healthy: true },
  { label: 'Base de données', healthy: true },
  { label: 'Paiements', healthy: true },
  { label: 'WhatsApp', healthy: false },
  { label: 'SMS', healthy: true },
];

export const TechFooter: React.FC = () => {
  return (
    <div className="w-full border-t border-surface-border py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-content-muted">
      <span>© 2024 Laundry Express. Tous droits réservés.</span>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-content-primary">Version v5.0.0</span>
        {statuses.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${s.healthy ? 'bg-green-500' : 'bg-orange-500'}`} />
            {s.label}: {s.healthy ? 'Healthy' : 'Dégradé'}
          </span>
        ))}
      </div>

      <span>Dernier déploiement : 07/06/2026 11:32</span>
    </div>
  );
};
