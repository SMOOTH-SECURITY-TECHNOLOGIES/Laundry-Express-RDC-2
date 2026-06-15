import React, { useState } from 'react';
import { Icon } from '../../Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  onSend: (userId: string, points: number, reason: string) => void;
}

export function ManualBonusModal({ open, onClose, onSend }: Props) {
  const [error, setError] = useState('');
  if (!open) return null;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const userId = String(fd.get('userId') || '').trim();
    const points = Number(fd.get('points'));
    const reason = String(fd.get('reason') || '').trim();
    if (!userId || points < 0 || !reason) {
      setError('Utilisateur, points (≥ 0) et motif sont requis.');
      return;
    }
    setError('');
    onSend(userId, points, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <form onSubmit={submit} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-bold">Envoyer bonus manuellement</h2>
          <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <input name="userId" required placeholder="ID utilisateur parrain" className="w-full mb-3 px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        <input name="points" type="number" min={0} required placeholder="Points bonus" className="w-full mb-3 px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        <textarea name="reason" required placeholder="Motif" rows={3} className="w-full mb-4 px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        <button type="submit" className="w-full py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm">Envoyer le bonus</button>
      </form>
    </div>
  );
}
