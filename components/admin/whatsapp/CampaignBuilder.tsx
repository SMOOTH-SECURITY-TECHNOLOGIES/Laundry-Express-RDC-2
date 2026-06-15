import { useState } from 'react';
import { Icon } from '../../Icon';

const STEPS = ['Audience', 'Template', 'Variables', 'Planning', 'Validation', 'Envoi'];

export function CampaignBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Campaign Builder</h3><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {STEPS.map((s, i) => (
            <button key={s} type="button" onClick={() => setStep(i)} className={`px-2 py-1 rounded text-xs whitespace-nowrap ${step === i ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{i + 1}. {s}</button>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-6 text-center text-sm text-gray-500 min-h-[120px] flex items-center justify-center">
          Étape {step + 1} : {STEPS[step]}
        </div>
        <div className="flex justify-between mt-4">
          <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="px-4 py-2 border rounded-xl text-sm disabled:opacity-50">Précédent</button>
          <button type="button" onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : onClose()} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">{step < STEPS.length - 1 ? 'Suivant' : 'Créer campagne'}</button>
        </div>
      </div>
    </div>
  );
}
