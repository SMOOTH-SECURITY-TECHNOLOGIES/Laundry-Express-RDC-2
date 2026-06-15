import React from 'react';
import { Icon } from '../../Icon';
import type { Zone } from '../../../lib/admin/zones-types';

interface ZoneTariffDrawerProps {
  zone: Zone | null;
  onClose: () => void;
  onSave: (zoneId: string) => void;
}

export function ZoneTariffDrawer({ zone, onClose, onSave }: ZoneTariffDrawerProps) {
  if (!zone) return null;
  const t = zone.tariff;
  const fields = [
    { label: 'Tarif base', value: `${t.base.toFixed(2)} $` },
    { label: 'Tarif express', value: `${t.express.toFixed(2)} $` },
    { label: 'Tarif nuit', value: `${t.night.toFixed(2)} $` },
    { label: 'Tarif weekend', value: `${t.weekend.toFixed(2)} $` },
    { label: 'Tarif hors zone', value: `${t.outOfZone.toFixed(2)} $` },
    { label: 'Tarif / km', value: `${t.perKm.toFixed(2)} $` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Configuration tarifaire — {zone.name}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between p-3 rounded-xl border border-gray-100">
              <span className="text-sm text-gray-600">{f.label}</span>
              <span className="text-sm font-bold text-gray-900">{f.value}</span>
            </div>
          ))}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Historique</h4>
            {t.history.map((h, i) => (
              <div key={i} className="flex justify-between text-xs py-2 border-b border-gray-50">
                <span>{h.date} — {h.changedBy}</span>
                <span className="font-medium">{h.base.toFixed(2)} $</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onSave(zone.id)} className="w-full py-2.5 rounded-xl bg-[#9333EA] text-white text-sm font-medium hover:bg-purple-700">Enregistrer les tarifs</button>
        </div>
      </div>
    </div>
  );
}
