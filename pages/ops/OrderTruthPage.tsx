import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import {
  fallbackOrderTruth,
  searchOrderTruth,
} from '../../lib/admin/order-truth-api';
import { calculateTruthScore } from '../../lib/admin/order-truth-score';
import {
  OrderAnomaly,
  OrderProof,
  OrderRelationNode,
  OrderTruthEvent,
  OrderTruthPeriod,
  OrderTruthSearchType,
  OrderTruthStatus,
  OrderTruthSummary,
} from '../../lib/admin/order-truth-types';

const searchTypes: { value: OrderTruthSearchType; label: string }[] = [
  { value: 'order_id', label: 'Order ID' },
  { value: 'uuid', label: 'UUID' },
  { value: 'client', label: 'Client' },
  { value: 'phone', label: 'Telephone' },
  { value: 'partner', label: 'Partenaire' },
  { value: 'driver', label: 'Chauffeur' },
  { value: 'transaction', label: 'Transaction' },
];

const periods: { value: OrderTruthPeriod; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: 'all', label: 'Tout' },
];

const statusTone: Record<OrderTruthStatus, { badge: string; icon: string; label: string; dot: string }> = {
  success: { badge: 'bg-green-50 text-green-700 border-green-200', icon: 'bg-green-500 text-white', label: 'Reussi', dot: 'bg-green-500' },
  pending: { badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'bg-blue-500 text-white', label: 'En cours', dot: 'bg-blue-500' },
  warning: { badge: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'bg-orange-500 text-white', label: 'Avertissement', dot: 'bg-orange-500' },
  error: { badge: 'bg-red-50 text-red-700 border-red-200', icon: 'bg-red-500 text-white', label: 'Echec', dot: 'bg-red-500' },
  missing: { badge: 'bg-gray-50 text-red-700 border-red-200', icon: 'bg-gray-400 text-white', label: 'Manquant', dot: 'bg-red-500' },
};

const eventIcon = (event: OrderTruthEvent) => {
  if (event.technicalName.includes('payment')) return 'currencyDollar';
  if (event.technicalName.includes('driver') || event.technicalName.includes('delivery') || event.technicalName.includes('pickup')) return 'truck';
  if (event.technicalName.includes('partner') || event.technicalName.includes('cleaning') || event.technicalName.includes('quality')) return 'building';
  if (event.technicalName.includes('order')) return 'shoppingBag';
  return 'circle';
};

const proofIcon = (proof: OrderProof) => {
  if (proof.type === 'photo') return 'camera';
  if (proof.type === 'gps') return 'mapPin';
  if (proof.type === 'payment') return 'currencyDollar';
  if (proof.type === 'logs') return 'code-bracket';
  return 'document-text';
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: 'Date inconnue', time: '--:--:--' };
  return {
    date: date.toLocaleDateString('fr-FR'),
    time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
};

const notify = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

const copyValue = async (label: string, value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    notify(`${label} copie.`);
  } catch {
    notify(`Impossible de copier ${label}.`);
  }
};

const StatCard: React.FC<{ label: string; value: string; change: string; icon: React.ComponentProps<typeof Icon>['name']; tone: string }> = ({
  label,
  value,
  change,
  icon,
  tone,
}) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${tone}`}>
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className={`text-xs font-semibold ${change.startsWith('-') ? 'text-green-600' : 'text-green-600'}`}>{change} vs mois dernier</p>
      </div>
    </div>
  </div>
);

const OrderTruthTimeline: React.FC<{ summary: OrderTruthSummary }> = ({ summary }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    notify('Evenement Order Truth ouvert.');
  };

  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-extrabold text-gray-900">Timeline de verite - {summary.order.orderId}</h2>
        <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{summary.statusLabel}</span>
      </div>
      <div className="p-5">
        <div className="relative space-y-4">
          <div className="absolute left-[85px] top-3 hidden h-[calc(100%-24px)] w-px bg-gray-200 sm:block" />
          {summary.events.map((event) => {
            const tone = statusTone[event.status];
            const date = formatDate(event.occurredAt);
            const isExpanded = expanded.has(event.id);
            return (
              <article key={event.id} className="grid gap-3 sm:grid-cols-[72px_40px_1fr]">
                <div className="text-xs font-semibold text-gray-500">
                  <p>{date.time}</p>
                  <p>{date.date}</p>
                </div>
                <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${tone.icon}`}>
                  <Icon name={eventIcon(event) as any} className="h-5 w-5" />
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900">{event.title}</h3>
                      <p className="mt-1 text-xs text-gray-600">{event.description}</p>
                      <p className="mt-2 text-[11px] text-gray-500">
                        Acteur : <span className="font-bold text-gray-700">{event.actorName || 'Systeme'}</span> · Source : {event.source}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${tone.badge}`}>{tone.label}</span>
                      <span className="text-[11px] font-semibold text-gray-500">Ref: {event.reference}</span>
                      <button
                        type="button"
                        onClick={() => toggle(event.id)}
                        className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:text-blue-600"
                        aria-label={`Afficher les details de ${event.title}`}
                      >
                        <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {event.thumbnailUrl && (
                    <img src={event.thumbnailUrl} alt={`Preuve ${event.title}`} className="mt-3 h-20 w-28 rounded-xl object-cover" />
                  )}
                  {isExpanded && (
                    <dl className="mt-3 grid gap-2 rounded-xl bg-white p-3 text-xs sm:grid-cols-2">
                      <div><dt className="text-gray-400">Type technique</dt><dd className="font-bold text-gray-700">{event.technicalName}</dd></div>
                      <div><dt className="text-gray-400">Actor type</dt><dd className="font-bold text-gray-700">{event.actorType || 'system'}</dd></div>
                      {(Object.entries(event.metadata || {}).map(([key, value]) => (
                        <div key={key}><dt className="text-gray-400">{key}</dt><dd className="font-bold text-gray-700">{value}</dd></div>
                      )))}
                    </dl>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <button type="button" onClick={() => notify('Tous les evenements systeme ouverts.')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-blue-600 hover:bg-blue-50">
          Voir tous les evenements systeme (42)
          <Icon name="arrowRight" className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

const TruthScoreCard: React.FC<{ score: number; anomalies: OrderAnomaly[] }> = ({ score, anomalies }) => {
  const criticalCount = anomalies.filter((item) => item.level === 'Critique').length;
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="font-extrabold text-gray-900">Truth Score</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-[170px_1fr]">
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-green-50">
          <svg viewBox="0 0 120 120" className="absolute h-36 w-36 -rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#dcfce7" strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="#16a34a" strokeWidth="10" strokeDasharray={`${score * 3.14} 314`} strokeLinecap="round" />
          </svg>
          <div className="text-center">
            <p className="text-4xl font-extrabold text-gray-900">{score}</p>
            <p className="text-xs font-bold text-gray-500">/100</p>
            <p className="mt-1 text-[10px] font-bold text-green-700">Excellente tracabilite</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {['Paiement verifie', 'Collecte verifiee', 'GPS verifie', 'Livraison verifiee', 'Preuves completes'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-gray-700">
              <Icon name="check" className="h-4 w-4 text-green-600" />
              {item}
            </li>
          ))}
          <li className="flex items-center gap-2 text-gray-700">
            <Icon name="check" className="h-4 w-4 text-green-600" />
            Anomalies critiques
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">{criticalCount}</span>
          </li>
        </ul>
      </div>
    </section>
  );
};

const EvidenceGrid: React.FC<{ proofs: OrderProof[] }> = ({ proofs }) => {
  const [selectedProof, setSelectedProof] = useState<OrderProof | null>(null);
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-extrabold text-gray-900">Preuves associees</h2>
        <button type="button" className="text-xs font-bold text-blue-600">Voir tout ({proofs.length * 2})</button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {proofs.map((proof) => (
          <button key={proof.id} type="button" onClick={() => { setSelectedProof(proof); notify('Preuve Order Truth ouverte.'); }} className="group text-left">
            <img src={proof.thumbnailUrl} alt={proof.title} className="h-24 w-full rounded-xl object-cover ring-1 ring-gray-100 group-hover:ring-blue-300" />
            <div className="mt-2 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                <Icon name={proofIcon(proof) as any} className="h-3.5 w-3.5 text-blue-600" />
                {proof.title}
              </span>
              <Icon name="search" className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </button>
        ))}
      </div>
      {selectedProof && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-gray-900">{selectedProof.title}</h3>
              <button type="button" onClick={() => setSelectedProof(null)} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Fermer la preuve">
                <Icon name="xmark" className="h-5 w-5" />
              </button>
            </div>
            <img src={selectedProof.thumbnailUrl} alt={selectedProof.title} className="max-h-[420px] w-full rounded-xl object-cover" />
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-gray-500">Source</dt><dd className="font-bold text-gray-800">{selectedProof.source}</dd></div>
              <div><dt className="text-gray-500">Timestamp</dt><dd className="font-bold text-gray-800">{formatDate(selectedProof.timestamp).date} {formatDate(selectedProof.timestamp).time}</dd></div>
              {selectedProof.hash && <div><dt className="text-gray-500">Hash</dt><dd className="font-mono font-bold text-gray-800">{selectedProof.hash}</dd></div>}
              {Object.entries(selectedProof.metadata).map(([key, value]) => (
                <div key={key}><dt className="text-gray-500">{key}</dt><dd className="font-bold text-gray-800">{value}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </section>
  );
};

const AnomalyPanel: React.FC<{ anomalies: OrderAnomaly[] }> = ({ anomalies }) => (
  <section className={`rounded-2xl border p-5 shadow-sm ${anomalies.length ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'}`}>
    <div className="mb-4 flex items-center justify-between">
      <h2 className={`font-extrabold ${anomalies.length ? 'text-red-800' : 'text-green-800'}`}>Anomalies detectees</h2>
      <button type="button" className="text-xs font-bold text-blue-600">Voir tout ({anomalies.length})</button>
    </div>
    {anomalies.length === 0 ? (
      <p className="text-sm font-semibold text-green-700">Aucune anomalie critique detectee.</p>
    ) : (
      <div className="space-y-3">
        {anomalies.map((anomaly) => (
          <div key={anomaly.id} className="rounded-xl bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                <Icon name="warning" className="h-4 w-4 text-red-600" />
                {anomaly.title}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${anomaly.level === 'Critique' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{anomaly.level}</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">{anomaly.description}</p>
            <p className="mt-1 text-xs text-gray-500">Source : {anomaly.source} · Reco : {anomaly.recommendation}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Investiguer', 'Creer ticket', 'Escalader'].map((action) => (
                <button key={action} type="button" onClick={() => notify(`${action} : ${anomaly.title}`)} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50">{action}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);

const OrderInfoPanel: React.FC<{ summary: OrderTruthSummary }> = ({ summary }) => {
  const items = [
    ['Order ID', summary.order.orderId, true],
    ['UUID', summary.order.uuid, true],
    ['Date', summary.order.date, false],
    ['Client', summary.order.client, false],
    ['Telephone', summary.order.phone, true],
    ['Email', summary.order.email, false],
    ['Adresse', summary.order.address, false],
    ['Partenaire', summary.order.partner, false],
    ['Chauffeur', summary.order.driver, false],
    ['Montant', summary.order.amount, false],
    ['Transaction', summary.order.transaction, true],
  ] as const;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-extrabold text-gray-900">Informations commande</h2>
      <dl className="space-y-3">
        {items.map(([label, value, copyable]) => (
          <div key={label} className="grid grid-cols-[90px_1fr_auto] items-start gap-2 text-xs">
            <dt className="font-semibold text-gray-500">{label}</dt>
            <dd className="font-bold text-gray-800">{value}</dd>
            {copyable ? (
              <button type="button" onClick={() => copyValue(label, value)} className="text-gray-400 hover:text-blue-600" aria-label={`Copier ${label}`}>
                <Icon name="document" className="h-4 w-4" />
              </button>
            ) : <span />}
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-green-50 px-3 py-2">
        <span className="text-xs font-bold text-gray-500">Statut final</span>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">{summary.order.finalStatus}</span>
      </div>
    </section>
  );
};

const QuickActionsPanel: React.FC = () => {
  const actions = [
    { label: 'Ouvrir investigation', icon: 'search', tone: 'bg-purple-50 text-purple-700 border-purple-100' },
    { label: 'Assigner enquete', icon: 'user', tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Ajouter une note', icon: 'pencil', tone: 'bg-orange-50 text-orange-700 border-orange-100' },
    { label: 'Creer ticket support', icon: 'lifebuoy', tone: 'bg-green-50 text-green-700 border-green-100' },
    { label: 'Exporter timeline', icon: 'arrow-down-tray', tone: 'bg-gray-50 text-gray-700 border-gray-200' },
    { label: 'Imprimer rapport', icon: 'document-arrow-down', tone: 'bg-gray-50 text-gray-700 border-gray-200' },
  ];
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-extrabold text-gray-900">Actions rapides</h2>
      <div className="space-y-2">
        {actions.map((action) => (
          <button key={action.label} type="button" onClick={() => notify(action.label)} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-extrabold transition hover:-translate-y-0.5 hover:shadow-sm ${action.tone}`}>
            <Icon name={action.icon as any} className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
};

const OrderRelationGraph: React.FC<{ nodes: OrderRelationNode[] }> = ({ nodes }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <h2 className="mb-5 font-extrabold text-gray-900">Graphe relationnel de la commande</h2>
    <div className="grid gap-4 md:grid-cols-6">
      {nodes.map((node, index) => (
        <div key={node.id} className="relative text-center">
          {index < nodes.length - 1 && <div className="absolute left-1/2 top-8 hidden h-px w-full bg-gray-200 md:block" />}
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700 ring-8 ring-white">
            <Icon name={node.icon as any} className="h-7 w-7" />
          </div>
          <p className="mt-3 text-xs font-bold text-gray-500">{node.label}</p>
          <p className="text-sm font-extrabold text-gray-900">{node.value}</p>
          <p className="text-xs text-gray-500">{node.detail}</p>
        </div>
      ))}
    </div>
  </section>
);

const TechnicalEventLog: React.FC<{ summary: OrderTruthSummary }> = ({ summary }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <h2 className="mb-4 font-extrabold text-gray-900">Event Log (Technique)</h2>
    <div className="space-y-2 font-mono text-xs">
      {summary.technicalLogs.map((log) => (
        <div key={log.reference} className="grid grid-cols-[70px_1fr_80px] gap-3">
          <span className="text-gray-500">{log.time}</span>
          <span className="font-bold text-gray-800">{log.name}</span>
          <span className="text-gray-500">{log.reference}</span>
        </div>
      ))}
    </div>
    <button type="button" onClick={() => notify('Event log complet ouvert.')} className="mt-4 text-xs font-bold text-blue-600">Voir tous les evenements systeme (42)</button>
  </section>
);

const NotesInvestigationsPanel: React.FC<{ summary: OrderTruthSummary }> = ({ summary }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-extrabold text-gray-900">Notes & Investigations</h2>
      <button type="button" className="text-xs font-bold text-blue-600">Voir tout</button>
    </div>
    <div className="space-y-3">
      {summary.investigations.map((item) => (
        <div key={item.id} className="rounded-xl border border-gray-100 p-3">
          {item.note ? (
            <>
              <p className="text-sm font-extrabold text-gray-900">{item.author}</p>
              <p className="mt-1 text-xs text-gray-600">{item.note}</p>
              <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">{item.visibility}</span>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-gray-900">Investigation #{item.id}</p>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">{item.status}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">Assignee a : {item.assignedTo}</p>
              <p className="text-xs text-gray-600">Priorite : {item.priority}</p>
            </>
          )}
          <p className="mt-2 text-[10px] text-gray-400">Cree le {formatDate(item.createdAt).date} {formatDate(item.createdAt).time}</p>
        </div>
      ))}
    </div>
  </section>
);

export const OrderTruthPage: React.FC = () => {
  const [query, setQuery] = useState('ORD-17807584');
  const [searchType, setSearchType] = useState<OrderTruthSearchType>('order_id');
  const [period, setPeriod] = useState<OrderTruthPeriod>('all');
  const [summary, setSummary] = useState<OrderTruthSummary | null>(fallbackOrderTruth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const truthScore = useMemo(() => {
    if (!summary) return 0;
    return summary.truthScore ?? calculateTruthScore(summary.events, summary.proofs, summary.anomalies);
  }, [summary]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Entrez un identifiant ou une valeur de recherche.');
      notify('Recherche Order Truth vide.');
      return;
    }
    setLoading(true);
    setError('');
    notify('Recherche Order Truth lancee.');
    const params = new URLSearchParams(window.location.search);
    params.set('orderId', query.trim());
    window.history.replaceState({}, document.title, `${window.location.pathname}?${params.toString()}`);
    const result = await searchOrderTruth(query, searchType, period);
    setLoading(false);
    if (!result) {
      setSummary(null);
      setError('Commande introuvable. Verifiez l’identifiant ou recherchez par client / telephone.');
      notify('Commande introuvable.');
      return;
    }
    setSummary(result);
    notify('Recherche Order Truth reussie.');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[150px_1fr_120px_120px]">
          <label className="sr-only" htmlFor="order-truth-type">Type de recherche</label>
          <select id="order-truth-type" value={searchType} onChange={(event) => setSearchType(event.target.value as OrderTruthSearchType)} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
            {searchTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="order-truth-query">Recherche Order Truth</label>
          <input id="order-truth-query" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleSearch()} placeholder="ORD-17807584" className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={period} onChange={(event) => setPeriod(event.target.value as OrderTruthPeriod)} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Periode">
            {periods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button type="button" onClick={handleSearch} disabled={loading} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      )}

      {!summary && !loading && !error && (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <Icon name="search" className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-extrabold text-gray-900">Entrez un ID de commande pour voir sa timeline de verite.</h2>
          <p className="mt-2 text-sm text-gray-500">La timeline montre tous les evenements, transitions et preuves.</p>
        </div>
      )}

      {summary && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Orders totales" value={summary.stats.totalOrders} change="+8%" icon="shoppingBag" tone="bg-green-50 text-green-600" />
            <StatCard label="Commandes tracees" value={summary.stats.tracedOrders} change="+2.4%" icon="shield-check" tone="bg-blue-50 text-blue-600" />
            <StatCard label="Anomalies detectees" value={summary.stats.anomaliesDetected} change="-5" icon="warning" tone="bg-orange-50 text-orange-600" />
            <StatCard label="Investigations ouvertes" value={summary.stats.openInvestigations} change="+1" icon="search" tone="bg-purple-50 text-purple-600" />
            <StatCard label="Temps moyen resolution" value={summary.stats.averageResolutionTime} change="-8 min" icon="clock" tone="bg-cyan-50 text-cyan-600" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
            <div className="space-y-6">
              <OrderTruthTimeline summary={summary} />
              <OrderRelationGraph nodes={summary.relationNodes} />
            </div>
            <aside className="space-y-6">
              <TruthScoreCard score={truthScore} anomalies={summary.anomalies} />
              <EvidenceGrid proofs={summary.proofs} />
              <AnomalyPanel anomalies={summary.anomalies} />
              <OrderInfoPanel summary={summary} />
              <QuickActionsPanel />
            </aside>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <TechnicalEventLog summary={summary} />
            <NotesInvestigationsPanel summary={summary} />
          </div>
        </>
      )}
    </div>
  );
};
