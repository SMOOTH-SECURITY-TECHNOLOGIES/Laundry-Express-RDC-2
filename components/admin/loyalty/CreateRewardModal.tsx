import React from 'react';
import { Icon } from '../../Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, points: number, value: number) => void;
}

export function CreateRewardModal({ open, onClose, onCreate }: Props) {
  if (!open) return null;
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onCreate(String(fd.get('name')), Number(fd.get('points')), Number(fd.get('value')));
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <form onSubmit={submit} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between mb-4"><h2 className="text-lg font-bold">Créer récompense</h2><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <input name="name" required placeholder="Nom (ex: 1$ réduction)" className="w-full mb-3 px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        <input name="points" type="number" required placeholder="Points requis" className="w-full mb-3 px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        <input name="value" type="number" step="0.01" required placeholder="Valeur ($)" className="w-full mb-4 px-3 py-2 border rounded-lg text-sm dark:bg-slate-800" />
        <button type="submit" className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-semibold text-sm">Créer</button>
      </form>
    </div>
  );
}
