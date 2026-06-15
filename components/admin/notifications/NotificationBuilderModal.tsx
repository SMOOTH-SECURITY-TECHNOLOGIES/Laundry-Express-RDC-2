import { useState } from 'react';
import { Icon } from '../../Icon';
import type { NotificationChannel } from '../../../lib/admin/notifications-types';

const STEPS = ['Canal', 'Audience', 'Contenu', 'Déclencheur', 'Planification', 'Prévisualisation', 'Confirmation'];

export function NotificationBuilderModal({ open, onClose, onSubmit }: {
  open: boolean; onClose: () => void;
  onSubmit: (data: { channel: NotificationChannel; audience: string; title: string; message: string; eventType: string }) => void;
}) {
  const [step, setStep] = useState(0);
  const [channel, setChannel] = useState<NotificationChannel>('push');
  const [audience, setAudience] = useState('Tous les clients');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [eventType, setEventType] = useState('promotion');

  if (!open) return null;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    onSubmit({ channel, audience, title, message, eventType });
    setStep(0); setTitle(''); setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Créer une notification</h2>
          <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-3 flex gap-1 overflow-x-auto">
          {STEPS.map((s, i) => (
            <span key={s} className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap ${i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s}</span>
          ))}
        </div>
        <div className="p-5 space-y-4">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-2">
              {(['push', 'whatsapp', 'sms', 'email'] as NotificationChannel[]).map((ch) => (
                <button key={ch} type="button" onClick={() => setChannel(ch)} className={`p-3 rounded-xl border text-sm font-semibold capitalize ${channel === ch ? 'border-blue-600 bg-blue-50' : ''}`}>{ch}</button>
              ))}
            </div>
          )}
          {step === 1 && (
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
              {['Tous les clients', 'Clients actifs', 'Clients inactifs', 'VIP', 'Partenaires', 'Chauffeurs', 'Segment personnalisé'].map((a) => <option key={a}>{a}</option>)}
            </select>
          )}
          {step === 2 && (
            <>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" className="w-full border rounded-xl px-3 py-2 text-sm" />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" rows={4} className="w-full border rounded-xl px-3 py-2 text-sm" />
            </>
          )}
          {step === 3 && (
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
              {['confirmation_commande', 'paiement_reussi', 'chauffeur_affecte', 'promotion', 'demande_avis'].map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          )}
          {step === 4 && <p className="text-sm text-gray-600">Envoi immédiat sélectionné. Planification disponible prochainement.</p>}
          {step === 5 && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <p className="font-semibold">{title || '(sans titre)'}</p>
              <p className="text-gray-600 mt-2">{message || '(sans message)'}</p>
              <p className="text-xs text-gray-400 mt-2">{channel} · {audience}</p>
            </div>
          )}
          {step === 6 && <p className="text-sm text-green-700 font-medium">Prêt à envoyer cette notification ?</p>}
        </div>
        <div className="flex justify-between p-5 border-t">
          <button type="button" onClick={prev} disabled={step === 0} className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40">Retour</button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">Suivant</button>
          ) : (
            <button type="button" onClick={finish} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold">Confirmer et envoyer</button>
          )}
        </div>
      </div>
    </div>
  );
}
