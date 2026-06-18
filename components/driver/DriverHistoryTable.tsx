import React, { useState } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { CARD, TYPO, SPACING, MISSION_STATUS_MAP, type StatusTone } from '../ui/tokens';

/* ─── Types ─── */
interface HistoryMission {
  id: string;
  orderRef: string;
  type: 'pickup' | 'delivery';
  status: string;
  statusLabel: string;
  clientName: string;
  zone: string;
  date: string;
  gain: number;
}

interface DriverHistoryTableProps {
  missions: HistoryMission[];
}

/* ─── Component ─── */
export const DriverHistoryTable: React.FC<DriverHistoryTableProps> = ({ missions }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedMissions = showAll ? missions : missions.slice(0, 10);

  if (missions.length === 0) {
    return (
      <div className={`${CARD.base} p-6 text-center`}>
        <Icon name="clock" className="mx-auto h-8 w-8 text-content-muted" />
        <p className="mt-2 text-sm font-bold text-content-muted">Aucune mission dans l'historique</p>
      </div>
    );
  }

  return (
    <div className={`${CARD.base} overflow-hidden`}>
      <div className={`${SPACING.cardPad} border-b border-surface-border-subtle`}>
        <div className="flex items-center justify-between">
          <h3 className={TYPO.sectionTitle}>Détail des missions</h3>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-black text-content-muted">
            {missions.length} mission{missions.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2 p-3">
        {displayedMissions.map((mission) => {
          const tone: StatusTone = MISSION_STATUS_MAP[mission.status] || 'neutral';
          return (
            <div key={mission.id} className="rounded-xl border border-surface-border-subtle bg-surface-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-brand-blue">#{mission.orderRef}</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-content-primary">{mission.clientName}</p>
                  <p className="text-[10px] text-content-muted">{mission.zone} · {mission.date}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <StatusChip label={mission.statusLabel} tone={tone} size="xs" />
                  <p className="text-xs font-black text-brand-blue">{mission.gain > 0 ? `${mission.gain.toFixed(2)} $` : '—'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-[10px] font-black uppercase text-content-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Réf.</th>
              <th className="px-4 py-2.5 text-left">Client</th>
              <th className="px-4 py-2.5 text-left">Zone</th>
              <th className="px-4 py-2.5 text-left">Statut</th>
              <th className="px-4 py-2.5 text-left">Date</th>
              <th className="px-4 py-2.5 text-right">Gain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border-subtle">
            {displayedMissions.map((mission) => {
              const tone: StatusTone = MISSION_STATUS_MAP[mission.status] || 'neutral';
              return (
                <tr key={mission.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-bold text-brand-blue">#{mission.orderRef}</td>
                  <td className="px-4 py-3 text-content-primary">{mission.clientName}</td>
                  <td className="px-4 py-3 text-content-muted">{mission.zone}</td>
                  <td className="px-4 py-3">
                    <StatusChip label={mission.statusLabel} tone={tone} size="xs" />
                  </td>
                  <td className="px-4 py-3 text-content-muted">{mission.date}</td>
                  <td className="px-4 py-3 text-right font-black text-brand-blue">
                    {mission.gain > 0 ? `${mission.gain.toFixed(2)} $` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show more */}
      {missions.length > 10 && (
        <div className="border-t border-surface-border-subtle p-3">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="flex w-full items-center justify-center gap-1 rounded-xl bg-surface-muted py-2 text-xs font-bold text-brand-blue"
          >
            {showAll ? 'Voir moins' : `Voir les ${missions.length} missions`}
            <Icon name={showAll ? 'chevron-up' : 'chevron-down'} className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DriverHistoryTable;
