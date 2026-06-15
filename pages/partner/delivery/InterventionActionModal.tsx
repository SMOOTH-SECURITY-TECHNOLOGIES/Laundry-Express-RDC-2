import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { PartnerDeliveryUrgentAction } from '../../../types';
import { partnerBtnGhost, partnerField, partnerLabel, partnerModalSubtitle, partnerModalTitle } from '../partner-ui';

export interface InterventionContext {
  deliveryId: string;
  issue: string;
  client: string;
  driver: string;
  commune: string;
  actionType: PartnerDeliveryUrgentAction;
}

export interface ContactInterventionResult {
  actionType: 'contact';
  channel: 'call' | 'sms' | 'whatsapp';
  followUp: 'none' | 'recall_15' | 'reschedule';
  note: string;
}

export interface ReassignInterventionResult {
  actionType: 'reassign';
  newDriver: string;
  reason: string;
  priority: 'normal' | 'high' | 'urgent';
  notifyClient: boolean;
  note: string;
}

export interface EscalateInterventionResult {
  actionType: 'escalate';
  destination: 'support' | 'manager' | 'platform';
  category: string;
  priority: 'medium' | 'high' | 'critical';
  assignTo: string;
  note: string;
}

export type InterventionResult =
  | ContactInterventionResult
  | ReassignInterventionResult
  | EscalateInterventionResult;

interface DriverOption {
  name: string;
  state: string;
  activeOrders: number;
  rating: number;
}

interface InterventionActionModalProps {
  isOpen: boolean;
  intervention: InterventionContext | null;
  drivers: DriverOption[];
  onClose: () => void;
  onConfirm: (result: InterventionResult) => void;
}

const ACTION_TITLES: Record<PartnerDeliveryUrgentAction, string> = {
  contact: 'Contacter le client',
  reassign: 'Reassigner la livraison',
  escalate: 'Escalader le dossier',
};

const CONTACT_CHANNELS = [
  { id: 'call' as const, label: 'Appel telephonique', icon: 'phone' as const, desc: 'Lancer un appel direct' },
  { id: 'sms' as const, label: 'SMS', icon: 'chatBubble' as const, desc: 'Message texte au client' },
  { id: 'whatsapp' as const, label: 'WhatsApp', icon: 'whatsapp' as const, desc: 'Message via WhatsApp' },
];

const REASSIGN_REASONS = ['Retard livreur', 'Surcharge', 'Indisponible', 'Zone plus proche', 'Autre'];
const ESCALATE_DESTINATIONS = [
  { id: 'support' as const, label: 'Support partenaire', desc: 'Equipe interne' },
  { id: 'manager' as const, label: 'Manager logistique', desc: 'Superviseur de zone' },
  { id: 'platform' as const, label: 'Plateforme Laundry Express', desc: 'Support central' },
];
const ESCALATE_CATEGORIES = ['Adresse incomplete', 'Client injoignable', 'Litige commande', 'Incident technique', 'Autre'];
const ESCALATE_ASSIGNEES = ['Equipe support', 'Marie K. (Manager)', 'Service litiges', 'Non assigne'];

export const InterventionActionModal: React.FC<InterventionActionModalProps> = ({
  isOpen,
  intervention,
  drivers,
  onClose,
  onConfirm,
}) => {
  const [channel, setChannel] = useState<ContactInterventionResult['channel']>('call');
  const [followUp, setFollowUp] = useState<ContactInterventionResult['followUp']>('none');
  const [newDriver, setNewDriver] = useState('');
  const [reason, setReason] = useState(REASSIGN_REASONS[0]);
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [notifyClient, setNotifyClient] = useState(true);
  const [destination, setDestination] = useState<EscalateInterventionResult['destination']>('support');
  const [category, setCategory] = useState(ESCALATE_CATEGORIES[0]);
  const [escalatePriority, setEscalatePriority] = useState<EscalateInterventionResult['priority']>('high');
  const [assignTo, setAssignTo] = useState(ESCALATE_ASSIGNEES[0]);
  const [note, setNote] = useState('');

  const availableDrivers = useMemo(
    () => drivers.filter((d) => d.name !== intervention?.driver && d.state === 'Actif'),
    [drivers, intervention?.driver],
  );

  useEffect(() => {
    if (!isOpen || !intervention) return;
    setChannel('call');
    setFollowUp('none');
    setNewDriver(availableDrivers[0]?.name || '');
    setReason(intervention.actionType === 'reassign' && intervention.issue.includes('Retard') ? 'Retard livreur' : REASSIGN_REASONS[0]);
    setPriority('high');
    setNotifyClient(true);
    setDestination('support');
    setCategory(
      intervention.actionType === 'escalate' && intervention.issue.toLowerCase().includes('adresse')
        ? 'Adresse incomplete'
        : ESCALATE_CATEGORIES[0],
    );
    setEscalatePriority('high');
    setAssignTo(ESCALATE_ASSIGNEES[0]);
    setNote('');
  }, [isOpen, intervention, availableDrivers]);

  if (!isOpen || !intervention) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intervention.actionType === 'contact') {
      onConfirm({ actionType: 'contact', channel, followUp, note: note.trim() });
      return;
    }
    if (intervention.actionType === 'reassign') {
      if (!newDriver) return;
      onConfirm({ actionType: 'reassign', newDriver, reason, priority, notifyClient, note: note.trim() });
      return;
    }
    onConfirm({
      actionType: 'escalate',
      destination,
      category,
      priority: escalatePriority,
      assignTo,
      note: note.trim(),
    });
  };

  const submitLabel =
    intervention.actionType === 'contact'
      ? 'Lancer le contact'
      : intervention.actionType === 'reassign'
        ? 'Confirmer la reassignation'
        : 'Creer le ticket';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className={partnerModalTitle}>{ACTION_TITLES[intervention.actionType]}</h2>
            <p className={partnerModalSubtitle}>
              {intervention.deliveryId} • {intervention.client} • {intervention.commune}
            </p>
            <p className="mt-0.5 text-xs font-medium text-red-400">{intervention.issue}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-content-muted hover:text-content-primary">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>

        {intervention.actionType === 'contact' && (
          <div className="space-y-4">
            <div>
              <label className={`${partnerLabel} font-bold`}>Canal de contact</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {CONTACT_CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      channel === c.id
                        ? 'border-brand-blue bg-brand-blue/15 ring-1 ring-brand-blue'
                        : 'border-surface-border bg-surface-muted hover:border-brand-blue/40'
                    }`}
                  >
                    <Icon name={c.icon} className="mb-1 h-4 w-4 text-brand-blue" />
                    <p className="text-xs font-bold text-content-primary">{c.label}</p>
                    <p className="text-[10px] text-content-muted">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={partnerLabel}>Suivi apres contact</label>
              <select className={partnerField} value={followUp} onChange={(e) => setFollowUp(e.target.value as ContactInterventionResult['followUp'])}>
                <option value="none">Aucun suivi automatique</option>
                <option value="recall_15">Rappel dans 15 minutes</option>
                <option value="reschedule">Reprogrammer la livraison</option>
              </select>
            </div>
          </div>
        )}

        {intervention.actionType === 'reassign' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-surface-muted p-3 text-xs">
              <span className="text-content-muted">Livreur actuel :</span>{' '}
              <span className="font-bold text-content-primary">{intervention.driver}</span>
            </div>
            <div>
              <label className={partnerLabel}>Nouveau livreur *</label>
              <select className={partnerField} value={newDriver} onChange={(e) => setNewDriver(e.target.value)} required>
                {availableDrivers.length === 0 ? (
                  <option value="">Aucun livreur disponible</option>
                ) : (
                  availableDrivers.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} — {d.activeOrders} cmd en cours • {d.rating}/5
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={partnerLabel}>Motif</label>
                <select className={partnerField} value={reason} onChange={(e) => setReason(e.target.value)}>
                  {REASSIGN_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={partnerLabel}>Priorite</label>
                <select className={partnerField} value={priority} onChange={(e) => setPriority(e.target.value as ReassignInterventionResult['priority'])}>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-content-primary">
              <input
                type="checkbox"
                checked={notifyClient}
                onChange={(e) => setNotifyClient(e.target.checked)}
                className="rounded border-surface-border"
              />
              Notifier le client du changement de livreur
            </label>
          </div>
        )}

        {intervention.actionType === 'escalate' && (
          <div className="space-y-4">
            <div>
              <label className={`${partnerLabel} font-bold`}>Escalader vers</label>
              <div className="space-y-2">
                {ESCALATE_DESTINATIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDestination(d.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                      destination === d.id
                        ? 'border-red-400 bg-red-500/15 ring-1 ring-red-400'
                        : 'border-surface-border bg-surface-muted hover:border-red-400/40'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-content-primary">{d.label}</p>
                      <p className="text-[10px] text-content-muted">{d.desc}</p>
                    </div>
                    {destination === d.id && <Icon name="check" className="h-4 w-4 text-red-500" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={partnerLabel}>Categorie</label>
                <select className={partnerField} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {ESCALATE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={partnerLabel}>Priorite</label>
                <select
                  className={partnerField}
                  value={escalatePriority}
                  onChange={(e) => setEscalatePriority(e.target.value as EscalateInterventionResult['priority'])}
                >
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
            </div>
            <div>
              <label className={partnerLabel}>Assigner a</label>
              <select className={partnerField} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                {ESCALATE_ASSIGNEES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className={partnerLabel}>
            Note {intervention.actionType === 'escalate' ? '(recommandee)' : '(optionnelle)'}
          </label>
          <textarea
            className={`${partnerField} min-h-[72px] resize-y`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Precisions pour l'equipe…"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={partnerBtnGhost}>
            Annuler
          </button>
          <button
            type="submit"
            disabled={intervention.actionType === 'reassign' && !newDriver}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};
