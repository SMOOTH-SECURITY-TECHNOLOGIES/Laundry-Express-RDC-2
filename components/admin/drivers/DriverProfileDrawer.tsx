import React from 'react';
import { Icon } from '../../Icon';
import type { Driver } from '../../../lib/admin/drivers-types';
import { DriverDocumentsPanel } from './DriverDocumentsPanel';

interface DriverProfileDrawerProps {
  driver: Driver | null;
  onClose: () => void;
  onOrderTruth: () => void;
  onInvestigate: () => void;
}

export function DriverProfileDrawer({ driver, onClose, onOrderTruth, onInvestigate }: DriverProfileDrawerProps) {
  if (!driver) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Profil chauffeur</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${driver.photoColor}`}>{driver.photoInitials}</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{driver.name}</h3>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${driver.statusColor}`}>{driver.statusLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Téléphone" value={driver.phone} />
            <Info label="Email" value={driver.email} />
            <Info label="Adresse" value={driver.address} />
            <Info label="Partenaire" value={driver.partner} />
            <Info label="Zone" value={driver.zone} />
            <Info label="Inscription" value={driver.registeredAt} />
            <Info label="Véhicule" value={`${driver.vehicle.type} — ${driver.vehicle.plate}`} />
          </div>

          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center">
            <p className="text-xs text-indigo-600 font-semibold uppercase">Driver Score</p>
            <p className="text-4xl font-extrabold text-indigo-700 mt-1">{driver.score.total}<span className="text-lg text-indigo-400">/100</span></p>
            <div className="grid grid-cols-5 gap-1 mt-3 text-[9px] text-indigo-600">
              <span>SLA 30%</span><span>Avis 25%</span><span>Ponct. 20%</span><span>Accept. 15%</span><span>Incid. 10%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { l: 'Missions terminées', v: driver.performance.completedMissions },
              { l: 'Temps collecte', v: `${driver.performance.avgPickupMinutes} min` },
              { l: 'Temps livraison', v: `${driver.performance.avgDeliveryMinutes} min` },
              { l: 'Annulations', v: driver.performance.cancellations },
              { l: 'Incidents', v: driver.performance.incidents },
            ].map((k) => (
              <div key={k.l} className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-[10px] text-gray-500">{k.l}</p>
                <p className="text-lg font-bold text-gray-900">{k.v}</p>
              </div>
            ))}
          </div>

          <DriverDocumentsPanel documents={driver.documents} />

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Historique missions</h4>
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400 border-b"><th className="py-2 text-left">Mission</th><th>Date</th><th>Client</th><th>Montant</th><th>Temps</th><th>Résultat</th></tr></thead>
              <tbody>
                {driver.missionHistory.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="py-2 font-mono">{m.id}</td><td>{m.date}</td><td>{m.client}</td>
                    <td>{m.amount.toLocaleString('fr-FR')} $</td><td>{m.duration}</td>
                    <td className={m.resultColor}>{m.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2">
            <button type="button" onClick={onOrderTruth} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Voir Truth Timeline</button>
            <button type="button" onClick={onInvestigate} className="w-full py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50">Investigate</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] text-gray-400 uppercase">{label}</p><p className="font-medium text-gray-900">{value}</p></div>;
}
