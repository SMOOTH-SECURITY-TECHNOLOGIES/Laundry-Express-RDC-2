import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useNavigation } from '../../context/NavigationContext';
import { exportTruthReport, fetchTruthDashboardData, runTruthAudit } from '../../lib/admin/truth-dashboard-api';
import {
  RevenueLeakageItem,
  TruthActivityEvent,
  TruthAnomaly,
  TruthCorridor,
  TruthDashboardData,
  TruthInvestigation,
  TruthSeverity,
  TruthViolation,
} from '../../lib/admin/truth-dashboard-types';

const severityTone: Record<TruthSeverity, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  major: 'bg-orange-100 text-orange-700 border-orange-200',
  minor: 'bg-blue-100 text-blue-700 border-blue-200',
};

const severityLabel: Record<TruthSeverity, string> = {
  critical: 'Critique',
  major: 'Majeure',
  minor: 'Mineure',
};

const rowTone = (severity?: string) => {
  if (severity === 'danger') return 'text-red-600';
  if (severity === 'warning') return 'text-orange-600';
  if (severity === 'success') return 'text-green-600';
  return 'text-gray-900';
};

const formatCurrency = (amount: number) => `${amount.toFixed(2)} $`;

const formatDateTime = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const notify = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>{children}</section>
);

const TruthScoreCard: React.FC<{ data: TruthDashboardData }> = ({ data }) => {
  const score = data.summary.truthScore;
  const scoreTone = score >= 95 ? 'text-green-600' : score >= 80 ? 'text-orange-600' : 'text-red-600';
  const breakdown = [
    ['Commandes verifiees', data.summary.ordersVerifiedRate],
    ['Paiements verifies', data.summary.paymentsVerifiedRate],
    ['Collectes verifiees', data.summary.pickupsVerifiedRate],
    ['Livraisons verifiees', data.summary.deliveriesVerifiedRate],
    ['Preuves completes', data.summary.proofsCompleteRate],
  ];

  return (
    <Card className="xl:col-span-2">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900">Truth Score Global</h2>
          <div className="mt-4 flex items-end gap-3">
            <p className={`text-5xl font-extrabold ${scoreTone}`}>{score}%</p>
            <span className="mb-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Excellent</span>
          </div>
          <div className="mt-8 h-3 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-green-600" style={{ width: `${score}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
        <div className="space-y-3">
          {breakdown.map(([label, value]) => (
            <div key={String(label)} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <Icon name="check" className="h-4 w-4 text-green-600" />
                {label}
              </span>
              <span className="text-sm font-extrabold text-gray-900">{value}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const CorridorCard: React.FC<{ corridor: TruthCorridor; onOpen: () => void }> = ({ corridor, onOpen }) => (
  <Card className={`${corridor.tone} bg-gradient-to-br`}>
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70">
        <Icon name={corridor.icon as any} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-extrabold text-gray-900">{corridor.title}</h3>
        <p className="mt-4 text-xs font-semibold text-gray-600">{corridor.primaryMetricLabel}</p>
        <p className="text-2xl font-extrabold text-gray-900">{corridor.primaryMetricValue}</p>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-black/5 pt-4">
      {corridor.rows.map((row) => (
        <div key={row.label}>
          <p className="text-[10px] font-semibold text-gray-500">{row.label}</p>
          <p className={`text-lg font-extrabold ${rowTone(row.severity)}`}>{row.value}</p>
        </div>
      ))}
    </div>
    <button type="button" onClick={onOpen} className="mt-4 flex w-full items-center justify-center gap-2 text-xs font-extrabold text-blue-700 hover:underline">
      Voir le detail
      <Icon name="arrowRight" className="h-3.5 w-3.5" />
    </button>
  </Card>
);

const TopAnomaliesCard: React.FC<{ anomalies: TruthAnomaly[]; onInvestigate: (id: string) => void }> = ({ anomalies, onInvestigate }) => (
  <Card>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-extrabold text-gray-900"><Icon name="fire" className="h-5 w-5 text-orange-500" />Top anomalies detectees</h2>
      <button className="text-xs font-bold text-blue-600" type="button">Voir tout (18)</button>
    </div>
    <div className="space-y-3">
      {anomalies.map((anomaly) => (
        <div key={anomaly.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl border border-gray-100 p-3">
          <Icon name="warning" className={`h-5 w-5 ${anomaly.severity === 'critical' ? 'text-red-600' : 'text-orange-500'}`} />
          <div>
            <p className="text-sm font-extrabold text-gray-900">{anomaly.title}</p>
            <p className="text-xs text-gray-500">{anomaly.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${severityTone[anomaly.severity]}`}>{severityLabel[anomaly.severity]}</span>
            <span className="text-xs font-bold text-gray-700">{anomaly.cases}</span>
            <button type="button" onClick={() => onInvestigate(anomaly.id)} className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-50">Investiguer</button>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const ViolationsTable: React.FC<{ violations: TruthViolation[]; onInvestigate: (id: string) => void }> = ({ violations, onInvestigate }) => (
  <Card className="xl:col-span-2">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-extrabold text-gray-900">Truth Violations <span className="font-medium text-gray-500">(corridors de verite rompus)</span></h2>
      <button className="text-xs font-bold text-blue-600" type="button">Voir toutes (24)</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-gray-500">
            {['Severite', 'Type', 'Reference', 'Detecte', 'Impact', 'Statut', 'Action'].map((head) => <th key={head} className="pb-3 font-bold">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {violations.map((violation) => (
            <tr key={violation.id} className="border-b last:border-0">
              <td className="py-3"><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${severityTone[violation.severity]}`}>{severityLabel[violation.severity]}</span></td>
              <td className="py-3 font-bold text-gray-900">{violation.type}</td>
              <td className="py-3 font-mono text-xs text-gray-700">{violation.reference}</td>
              <td className="py-3 text-gray-600">{violation.detectedAt}</td>
              <td className="py-3 text-gray-700">{violation.impact}</td>
              <td className="py-3"><span className={`inline-flex items-center gap-1 text-xs font-bold ${violation.status === 'Résolu' ? 'text-green-600' : violation.status === 'En cours' ? 'text-orange-600' : 'text-red-600'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{violation.status}</span></td>
              <td className="py-3"><button type="button" onClick={() => onInvestigate(violation.id)} className="text-xs font-bold text-blue-600 hover:underline">Investiguer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const InvestigationsCard: React.FC<{ investigations: TruthInvestigation[]; onOpen: (id: string) => void }> = ({ investigations, onOpen }) => (
  <Card>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-extrabold text-gray-900">Live Investigations</h2>
      <button className="text-xs font-bold text-blue-600" type="button">Voir tout ({investigations.length})</button>
    </div>
    <div className="space-y-3">
      {investigations.map((investigation) => (
        <button key={investigation.id} type="button" onClick={() => onOpen(investigation.id)} className="grid w-full grid-cols-[1fr_auto] gap-3 border-l-2 border-blue-100 pl-3 text-left">
          <div>
            <p className="text-sm font-extrabold text-gray-900">{investigation.id} <span className={`ml-1 rounded-full border px-2 py-0.5 text-[10px] ${severityTone[investigation.severity]}`}>{severityLabel[investigation.severity]}</span></p>
            <p className="text-xs font-semibold text-gray-700">{investigation.title}</p>
            <p className="text-xs text-gray-500">Assigne a <span className="font-bold text-gray-700">{investigation.assignedTo}</span></p>
          </div>
          <span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${investigation.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {investigation.status === 'resolved' ? 'Resolue' : 'En cours'}
          </span>
        </button>
      ))}
    </div>
  </Card>
);

const RevenueLeakageCard: React.FC<{ items: RevenueLeakageItem[]; trend: number[]; total: number; onOpen: () => void }> = ({ items, trend, total, onOpen }) => (
  <Card>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-extrabold text-gray-900">Revenue Leakage</h2>
      <button onClick={onOpen} className="text-xs font-bold text-blue-600" type="button">Voir tout</button>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className={`rounded-xl border p-3 ${item.tone}`}>
          <p className="text-[10px] font-bold">{item.label}</p>
          <p className="mt-2 text-lg font-extrabold">{formatCurrency(item.amount)}</p>
        </div>
      ))}
    </div>
    <svg viewBox="0 0 240 58" className="mt-4 h-14 w-full" aria-label="Tendance revenue leakage sur 7 jours">
      <path d={trend.map((point, index) => `${index === 0 ? 'M' : 'L'} ${index * 40} ${58 - point}`).join(' ')} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <div className="mt-3 flex items-center justify-between rounded-xl bg-red-50 px-3 py-2">
      <span className="text-xs font-bold text-gray-700">Perte potentielle totale</span>
      <span className="text-lg font-extrabold text-red-600">{formatCurrency(total)}</span>
    </div>
  </Card>
);

const SlaCenterCard: React.FC<{ within: number; atRisk: number; breached: number; onOpen: () => void }> = ({ within, atRisk, breached, onOpen }) => (
  <Card>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-extrabold text-gray-900">SLA Center</h2>
      <button onClick={onOpen} className="text-xs font-bold text-blue-600" type="button">Voir tout</button>
    </div>
    <div className="grid grid-cols-3 gap-4 text-center">
      <div><p className="text-3xl font-extrabold text-green-600">{within}%</p><p className="text-xs text-gray-500">Dans SLA</p></div>
      <div><p className="text-3xl font-extrabold text-orange-500">{atRisk}%</p><p className="text-xs text-gray-500">A risque</p></div>
      <div><p className="text-3xl font-extrabold text-red-600">{breached}%</p><p className="text-xs text-gray-500">Depasse</p></div>
    </div>
    <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-gray-100">
      <div className="bg-green-500" style={{ width: `${within}%` }} />
      <div className="bg-orange-400" style={{ width: `${atRisk}%` }} />
      <div className="bg-red-500" style={{ width: `${breached}%` }} />
    </div>
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />Dans SLA</span>
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" />A risque</span>
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Depasse</span>
    </div>
  </Card>
);

const ActivityFeedCard: React.FC<{ events: TruthActivityEvent[] }> = ({ events }) => (
  <Card>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-extrabold text-gray-900">Truth Activity Feed <span className="text-xs font-medium text-gray-500">(temps reel)</span></h2>
      <button className="text-xs font-bold text-blue-600" type="button">Voir tout</button>
    </div>
    <div className="space-y-3">
      {events.map((event) => (
        <div key={`${event.time}-${event.reference}`} className="grid grid-cols-[46px_24px_1fr] gap-3">
          <span className="text-xs font-bold text-gray-600">{event.time}</span>
          <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${event.severity === 'critical' ? 'bg-red-100 text-red-600' : event.severity === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            <Icon name={event.severity === 'critical' ? 'warning' : 'check'} className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-gray-900">{event.title} <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{event.reference}</span></p>
            <p className="text-xs text-gray-500">{event.detail}</p>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const QuickActionsBar: React.FC<{ onNavigate: (item: string) => void; onAudit: () => void; onExport: () => void; onCreateInvestigation: () => void }> = ({
  onNavigate,
  onAudit,
  onExport,
  onCreateInvestigation,
}) => {
  const actions = [
    { label: 'Rechercher commande', icon: 'search', action: () => window.dispatchEvent(new CustomEvent('admin-focus-search')), tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Ouvrir Order Truth', icon: 'document-text', action: () => onNavigate('Order Truth'), tone: 'bg-green-50 text-green-700 border-green-100' },
    { label: 'Ouvrir Anomaly Center', icon: 'warning', action: () => onNavigate('Anomalies'), tone: 'bg-orange-50 text-orange-700 border-orange-100' },
    { label: 'Creer Investigation', icon: 'shield', action: onCreateInvestigation, tone: 'bg-purple-50 text-purple-700 border-purple-100' },
    { label: 'Exporter rapport', icon: 'arrow-down-tray', action: onExport, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Audit automatique', icon: 'play', action: onAudit, tone: 'bg-gray-50 text-gray-700 border-gray-200' },
  ];
  return (
    <Card>
      <h2 className="mb-4 font-extrabold text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {actions.map((action) => (
          <button key={action.label} type="button" onClick={action.action} className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center text-xs font-extrabold transition hover:-translate-y-0.5 hover:shadow-sm ${action.tone}`}>
            <Icon name={action.icon as any} className="h-5 w-5" />
            {action.label}
          </button>
        ))}
      </div>
    </Card>
  );
};

const SimpleModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div role="dialog" aria-modal="true" className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Fermer"><Icon name="xmark" className="h-5 w-5" /></button>
      </div>
      {children}
    </div>
  </div>
);

export const TruthDashboard: React.FC = () => {
  const { setAdminSectionParams } = useNavigation();
  const [dashboardData, setDashboardData] = useState<TruthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [modal, setModal] = useState<'investigation' | 'audit' | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTruthDashboardData();
      setDashboardData(result.data);
      setIsFallback(result.isFallback);
    } catch {
      setError('Impossible de charger le Truth Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const openAuditModal = () => setModal('audit');
    window.addEventListener('admin-open-audit-modal', openAuditModal);
    return () => window.removeEventListener('admin-open-audit-modal', openAuditModal);
  }, []);

  const potentialLeakage = useMemo(
    () => dashboardData?.revenueLeakage.reduce((sum, item) => sum + item.amount, 0) || 0,
    [dashboardData]
  );

  const handleNavigate = (section: string) => setAdminSectionParams({ section });
  const handleAudit = async () => {
    await runTruthAudit();
    notify('Audit automatique lance.');
    setModal(null);
  };
  const handleExport = async () => {
    await exportTruthReport();
    notify('Rapport Truth Dashboard exporte.');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-6">
          {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <Card>
        <div className="flex items-center gap-3 text-red-700">
          <Icon name="warning" className="h-5 w-5" />
          <p className="font-bold">{error || 'Impossible de charger le Truth Dashboard.'}</p>
        </div>
        <button type="button" onClick={loadData} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Reessayer</button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isFallback && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
          Mode degrade : donnees de demonstration centralisees utilisees pour les modules non exposes par l'API.
        </div>
      )}

      <div className="flex justify-end">
        <p className="text-xs font-semibold text-gray-500">
          Derniere verification : {formatDateTime(dashboardData.summary.lastCheckedAt)}
          <span className="ml-2 inline-block h-2 w-2 rounded-full bg-green-500" />
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-6">
        <TruthScoreCard data={dashboardData} />
        {dashboardData.corridors.map((corridor) => (
          <CorridorCard key={corridor.id} corridor={corridor} onOpen={() => { notify(`Corridor ouvert : ${corridor.title}`); }} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.3fr_1fr]">
        <TopAnomaliesCard anomalies={dashboardData.anomalies} onInvestigate={(id) => { notify(`Investigation anomalie ${id}`); setModal('investigation'); }} />
        <ViolationsTable violations={dashboardData.violations} onInvestigate={(id) => { notify(`Investigation violation ${id}`); setModal('investigation'); }} />
        <InvestigationsCard investigations={dashboardData.investigations} onOpen={(id) => notify(`Investigation ouverte ${id}`)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <RevenueLeakageCard items={dashboardData.revenueLeakage} trend={dashboardData.revenueTrend} total={potentialLeakage} onOpen={() => handleNavigate('Revenue Leakage')} />
        <SlaCenterCard within={dashboardData.sla.within} atRisk={dashboardData.sla.atRisk} breached={dashboardData.sla.breached} onOpen={() => handleNavigate('SLA Center')} />
        <ActivityFeedCard events={dashboardData.activityFeed} />
      </div>

      <QuickActionsBar
        onNavigate={handleNavigate}
        onAudit={() => setModal('audit')}
        onExport={handleExport}
        onCreateInvestigation={() => setModal('investigation')}
      />

      {modal === 'investigation' && (
        <SimpleModal title="Creer une investigation" onClose={() => setModal(null)}>
          <div className="grid gap-3">
            {['Type', 'Reference commande', 'Severite', 'Assigne a', 'Priorite'].map((field) => (
              <label key={field} className="text-sm font-bold text-gray-700">
                {field}
                <input className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
            ))}
            <label className="text-sm font-bold text-gray-700">Note<textarea className="mt-1 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>
            <button type="button" onClick={() => { notify('Investigation creee.'); setModal(null); }} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white">Creer investigation</button>
          </div>
        </SimpleModal>
      )}

      {modal === 'audit' && (
        <SimpleModal title="Lancer un audit" onClose={() => setModal(null)}>
          <div className="space-y-3">
            {['Audit commandes', 'Audit paiements', 'Audit logistique', 'Audit marketplace', 'Audit complet'].map((option) => (
              <label key={option} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-sm font-bold text-gray-700">
                <input type="checkbox" className="h-4 w-4" />
                {option}
              </label>
            ))}
            <button type="button" onClick={handleAudit} className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-extrabold text-white">Lancer audit</button>
          </div>
        </SimpleModal>
      )}
    </div>
  );
};
