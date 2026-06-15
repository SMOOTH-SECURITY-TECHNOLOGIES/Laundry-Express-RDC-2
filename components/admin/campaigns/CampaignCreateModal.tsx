import React, { useState } from 'react';
import { Icon } from '../../Icon';

const STEPS = ['Audience', 'Canal', 'Contenu', 'Programmation', 'Validation'];
const CHANNELS = ['sms', 'whatsapp', 'email', 'push'];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; channel: string; audience: string; content: string; budget: number; scheduledAt?: string }) => void;
  editCampaign?: { id: string; name: string; channel: string; audience: string | null } | null;
}

export function CampaignCreateModal({ open, onClose, onCreate, editCampaign }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(editCampaign?.name || '');
  const [audience, setAudience] = useState(editCampaign?.audience || '');
  const [channel, setChannel] = useState(editCampaign?.channel || 'whatsapp');
  const [content, setContent] = useState('');
  const [budget, setBudget] = useState(500);
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');
  if (!open) return null;

  const submit = () => {
    if (!name.trim() || !audience.trim() || !content.trim() || budget < 0) {
      setError('Nom, audience, contenu et budget sont requis.');
      return;
    }
    onCreate({ name, channel, audience, content, budget, scheduledAt: scheduledAt || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-bold">{editCampaign ? 'Modifier campagne' : 'Nouvelle campagne'}</h2>
          <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-1 mb-4">{STEPS.map((s, i) => <span key={s} className={`text-[10px] px-2 py-1 rounded-full ${i === step ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}. {s}</span>)}</div>
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        {step === 0 && (<><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la campagne" className="w-full mb-3 px-3 py-2 border rounded-lg text-sm" /><input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Audience cible" className="w-full px-3 py-2 border rounded-lg text-sm" /></>)}
        {step === 1 && (<div className="flex flex-wrap gap-2">{CHANNELS.map((ch) => <button key={ch} type="button" onClick={() => setChannel(ch)} className={`px-3 py-2 rounded-lg text-xs border capitalize ${channel === ch ? 'bg-purple-100 border-purple-400' : ''}`}>{ch}</button>)}</div>)}
        {step === 2 && (<textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={channel === 'email' ? 'Contenu HTML' : channel === 'whatsapp' ? 'Template WhatsApp' : 'Message'} rows={5} className="w-full px-3 py-2 border rounded-lg text-sm" />)}
        {step === 3 && (<><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full mb-3 px-3 py-2 border rounded-lg text-sm" /><input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} placeholder="Budget ($)" className="w-full px-3 py-2 border rounded-lg text-sm" /></>)}
        {step === 4 && (<div className="text-xs space-y-1"><p><strong>{name}</strong> — {channel}</p><p>Audience: {audience}</p><p>Budget: {budget} $</p>{scheduledAt && <p>Programmé: {scheduledAt}</p>}</div>)}
        <div className="flex gap-2 mt-4">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-2 border rounded-lg text-sm">Retour</button>}
          {step < 4 ? <button type="button" onClick={() => setStep(step + 1)} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold">Suivant</button>
            : <button type="button" onClick={submit} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">{editCampaign ? 'Enregistrer' : 'Créer la campagne'}</button>}
        </div>
      </div>
    </div>
  );
}
