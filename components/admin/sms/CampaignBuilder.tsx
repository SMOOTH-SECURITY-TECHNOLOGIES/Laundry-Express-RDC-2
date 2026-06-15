import { useState } from 'react';
import { Icon } from '../../Icon';

const STEPS = ['Nom', 'Audience', 'Message', 'Planning'];

export function CampaignBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Créer campagne SMS</h3><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <div className="flex gap-1 mb-4">{STEPS.map((s, i) => <button key={s} type="button" onClick={() => setStep(i)} className={`px-2 py-1 rounded text-xs ${step === i ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{i + 1}. {s}</button>)}</div>
        {step === 0 && <input placeholder="Nom de la campagne" className="w-full px-3 py-2 border rounded-xl text-sm" />}
        {step === 1 && <select className="w-full px-3 py-2 border rounded-xl text-sm"><option>Clients actifs</option><option>VIP</option><option>Chauffeurs</option><option>Partenaires</option></select>}
        {step === 2 && (<><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-xl text-sm" /><p className={`text-xs mt-1 ${message.length > 160 ? 'text-red-600' : 'text-gray-400'}`}>{message.length}/160 caractères</p></>)}
        {step === 3 && <div className="flex gap-2"><button type="button" className="flex-1 py-2 border rounded-xl text-sm">Immédiat</button><button type="button" className="flex-1 py-2 border rounded-xl text-sm">Planifié</button></div>}
        <div className="flex justify-between mt-6">
          <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="px-4 py-2 border rounded-xl text-sm disabled:opacity-50">Précédent</button>
          <button type="button" onClick={() => step < 3 ? setStep(step + 1) : onClose()} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">{step < 3 ? 'Suivant' : 'Créer'}</button>
        </div>
      </div>
    </div>
  );
}
