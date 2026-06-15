import { useEffect, useState } from 'react';
import { Icon } from '../../Icon';
import type { PromoCreatePayload, PromoType, PromoSegment, PromoChannel } from '../../../lib/admin/promotions-types';
import { partnerBtnGhost, partnerField, partnerLabel, partnerModalTitle } from '../../../pages/partner/partner-ui';

const defaultForm: PromoCreatePayload = {
  name: '',
  code: '',
  description: '',
  type: 'percentage',
  value: '20%',
  maxUsage: 1000,
  maxPerClient: 3,
  maxBudget: 5000,
  startDate: '',
  endDate: '',
  segments: ['new'],
  channels: ['whatsapp'],
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PromoCreatePayload) => void;
}

const types: { key: PromoType; label: string }[] = [
  { key: 'percentage', label: 'Pourcentage' }, { key: 'fixed', label: 'Montant' },
  { key: 'delivery', label: 'Livraison' }, { key: 'cashback', label: 'Cashback' },
];
const segments: { key: PromoSegment; label: string }[] = [
  { key: 'new', label: 'Nouveaux' }, { key: 'active', label: 'Actifs' }, { key: 'dormant', label: 'Inactifs' },
  { key: 'vip', label: 'VIP' }, { key: 'enterprise', label: 'Entreprise' },
];
const channels: { key: PromoChannel; label: string }[] = [
  { key: 'email', label: 'Email' }, { key: 'whatsapp', label: 'WhatsApp' }, { key: 'sms', label: 'SMS' },
  { key: 'push', label: 'Push' }, { key: 'web', label: 'Web' },
];

export function PromotionCreateWizard({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<PromoCreatePayload>(defaultForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.code.trim()) {
      setError('Le code promo est obligatoire.');
      return;
    }
    if (!form.value.trim()) {
      setError('Indiquez une valeur (ex: 20% ou 10$).');
      return;
    }
    setError('');
    onSubmit({ ...form, code: form.code.trim().toUpperCase() });
  };

  const chipClass = (selected: boolean, color: 'blue' | 'purple' | 'green') => {
    if (selected) {
      if (color === 'purple') return 'bg-purple-600 text-white';
      if (color === 'green') return 'bg-green-600 text-white';
      return 'bg-brand-blue text-white';
    }
    return 'border border-surface-border bg-surface-muted text-content-muted hover:text-content-primary';
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} role="presentation" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className={partnerModalTitle}>Creer une promotion</h2>
          <button type="button" onClick={onClose} className="text-content-muted hover:text-content-primary" aria-label="Fermer">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <label className={partnerLabel}>Nom</label>
            <input className={partnerField} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Offre bienvenue" />
          </div>
          <div>
            <label className={partnerLabel}>Code *</label>
            <input className={partnerField} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME20" required />
          </div>
          <div>
            <label className={partnerLabel}>Description</label>
            <textarea className={`${partnerField} min-h-[64px] resize-y`} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className={partnerLabel}>Type</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {types.map((t) => (
                <button key={t.key} type="button" onClick={() => setForm({ ...form, type: t.key })} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${chipClass(form.type === t.key, 'blue')}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={partnerLabel}>Valeur *</label>
            <input className={partnerField} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="20% ou 10$" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={partnerLabel}>Usage total</label><input type="number" min={1} className={partnerField} value={form.maxUsage} onChange={(e) => setForm({ ...form, maxUsage: +e.target.value })} /></div>
            <div><label className={partnerLabel}>Par client</label><input type="number" min={1} className={partnerField} value={form.maxPerClient} onChange={(e) => setForm({ ...form, maxPerClient: +e.target.value })} /></div>
            <div><label className={partnerLabel}>Budget max</label><input type="number" min={0} className={partnerField} value={form.maxBudget} onChange={(e) => setForm({ ...form, maxBudget: +e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={partnerLabel}>Debut</label><input type="date" className={partnerField} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className={partnerLabel}>Fin</label><input type="date" className={partnerField} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div>
            <label className={partnerLabel}>Segments</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {segments.map((s) => (
                <button key={s.key} type="button" onClick={() => setForm({ ...form, segments: form.segments.includes(s.key) ? form.segments.filter((x) => x !== s.key) : [...form.segments, s.key] })} className={`rounded-lg px-2 py-1 text-[10px] font-medium ${chipClass(form.segments.includes(s.key), 'purple')}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={partnerLabel}>Canaux</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {channels.map((c) => (
                <button key={c.key} type="button" onClick={() => setForm({ ...form, channels: form.channels.includes(c.key) ? form.channels.filter((x) => x !== c.key) : [...form.channels, c.key] })} className={`rounded-lg px-2 py-1 text-[10px] font-medium ${chipClass(form.channels.includes(c.key), 'green')}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs font-medium text-red-400">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={partnerBtnGhost}>Annuler</button>
          <button type="button" onClick={handleSubmit} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700">
            Creer la promotion
          </button>
        </div>
      </div>
    </div>
  );
}
