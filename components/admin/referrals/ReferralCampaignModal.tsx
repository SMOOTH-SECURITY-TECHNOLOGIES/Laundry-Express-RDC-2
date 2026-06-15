import React, { useState } from 'react';
import { Icon } from '../../Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, audience: string, budget: number, startDate: string, endDate: string) => void;
}

export function ReferralCampaignModal({ open, onClose, onCreate }: Props) {
  const [error, setError] = useState('');
  if (!open) return null;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const audience = String(fd.get('audience') || '').trim();
    const budget = Number(fd.get('budget'));
    const startDate = String(fd.get('startDate') || '');
    const endDate = String(fd.get('endDate') || '');
    if (!name || !audience || !startDate || !endDate || budget < 0) {
      setError('Nom, dates, audience et budget sont requis.');
      return;
    }
    setError('');
    onCreate(name, audience, budget, startDate, endDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <form onSubmit={submit} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-bold">Créer campagne parrainage</h2>
          <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <input name="name" required placeholder="Nom de la campagne" className="w-full mb-3 px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        <input name="audience" required placeholder="Audience cible" className="w-full mb-3 px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        <input name="budget" type="number" min={0} required placeholder="Budget ($)" className="w-full mb-3 px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-2 mb-4">
          <input name="startDate" type="date" required className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
          <input name="endDate" type="date" required className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        </div>
        <button type="submit" className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-semibold text-sm">Créer la campagne</button>
      </form>
    </div>
  );
}
