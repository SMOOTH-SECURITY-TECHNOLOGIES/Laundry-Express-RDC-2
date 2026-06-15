import React, { useState } from 'react';
import { Icon } from '../../Icon';

export function AudienceBuilderModal({ open, onClose, onEstimate }: { open: boolean; onClose: () => void; onEstimate: (size: number) => void }) {
  const [zone, setZone] = useState('all');
  const [freq, setFreq] = useState('any');
  if (!open) return null;
  const est = Math.round(1284 * (zone === 'all' ? 1 : 0.4) * (freq === 'high' ? 0.2 : 0.5));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between mb-4"><h2 className="text-lg font-bold">Audience Builder</h2><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full mb-3 px-3 py-2 border rounded-lg text-sm"><option value="all">Toutes zones</option><option value="kinshasa">Kinshasa</option><option value="lubumbashi">Lubumbashi</option></select>
        <select value={freq} onChange={(e) => setFreq(e.target.value)} className="w-full mb-3 px-3 py-2 border rounded-lg text-sm"><option value="any">Toute fréquence</option><option value="high">Fréquence élevée</option><option value="low">Inactifs</option></select>
        <p className="text-center text-2xl font-bold text-purple-700 mb-4">{est.toLocaleString('fr-FR')} utilisateurs</p>
        <button type="button" onClick={() => { onEstimate(est); onClose(); }} className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold">Appliquer le segment</button>
      </div>
    </div>
  );
}
