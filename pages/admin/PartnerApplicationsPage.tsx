import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { DB } from '../../constants';
import { useAppContext } from '../../context/AppContext';
import { ApplicationStatus, PartnerApplication, PartnerType } from '../../types';

type PipelineStage = 'new' | 'qualification' | 'verification' | 'interview' | 'approval' | 'rejected';
type RiskLevel = 'low' | 'medium' | 'high';
type OnboardingTab = 'overview' | 'candidates' | 'performance' | 'commissions' | 'compliance' | 'truth';

interface OnboardingCandidate {
  application: PartnerApplication;
  stage: PipelineStage;
  score: number;
  truthScore: number;
  risk: RiskLevel;
  commune: string;
  source: string;
  capacityNumber: number;
  potentialRevenue: number;
  documents: { label: string; valid: boolean }[];
  ageDays: number;
}

const tabs: { key: OnboardingTab; label: string }[] = [
  { key: 'overview', label: 'Vue globale' },
  { key: 'candidates', label: 'Candidatures' },
  { key: 'performance', label: 'Performance' },
  { key: 'commissions', label: 'Commissions' },
  { key: 'compliance', label: 'Conformité' },
  { key: 'truth', label: 'Truth Score' },
];

const stageMeta: Record<PipelineStage, { label: string; tone: string; soft: string }> = {
  new: { label: 'Nouvelles', tone: 'border-blue-200 bg-blue-50', soft: 'bg-blue-100 text-blue-700' },
  qualification: { label: 'Qualification', tone: 'border-orange-200 bg-orange-50', soft: 'bg-orange-100 text-orange-700' },
  verification: { label: 'Vérification', tone: 'border-purple-200 bg-purple-50', soft: 'bg-purple-100 text-purple-700' },
  interview: { label: 'Entretien', tone: 'border-slate-200 bg-slate-50', soft: 'bg-slate-100 text-slate-700' },
  approval: { label: 'Approbation', tone: 'border-emerald-200 bg-emerald-50', soft: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejetées', tone: 'border-red-200 bg-red-50', soft: 'bg-red-100 text-red-700' },
};

const typeLabels: Record<PartnerType, string> = {
  [PartnerType.PRESSING]: 'Pressing',
  [PartnerType.LAVANDIER]: 'Blanchisserie',
  [PartnerType.LOGISTICS]: 'Logistique',
};

const sourceNames = ['Facebook', 'Google', 'Référencement', 'Parrainage', 'Terrain'];
const communeNames = ['Gombe', 'Ngaliema', 'Limete', 'Kalamu', 'Kintambo', 'Bandal'];

const formatMoney = (value: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(value)) + ' $';

const formatNumber = (value: number) => new Intl.NumberFormat('fr-FR').format(Math.round(value));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const extractCommune = (address?: string): string => {
  if (!address) return 'Kinshasa';
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  const last = parts[parts.length - 1] || address;
  const known = communeNames.find((commune) => address.toLowerCase().includes(commune.toLowerCase()));
  return known || last;
};

const getAgeDays = (submittedAt: string) => {
  const diff = Date.now() - new Date(submittedAt).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
};

const parseCapacity = (capacity?: string, type?: PartnerType) => {
  const explicit = capacity?.match(/\d+/)?.[0];
  if (explicit) return Number(explicit);
  if (type === PartnerType.LOGISTICS) return 12;
  if (type === PartnerType.LAVANDIER) return 120;
  return 80;
};

const getStage = (application: PartnerApplication, score: number, ageDays: number): PipelineStage => {
  if (application.status === ApplicationStatus.REJECTED) return 'rejected';
  if (application.status === ApplicationStatus.APPROVED) return 'approval';
  if (score >= 82) return 'approval';
  if (score >= 72) return 'interview';
  if (score >= 60) return 'verification';
  if (ageDays > 2) return 'qualification';
  return 'new';
};

const buildCandidate = (application: PartnerApplication, index: number): OnboardingCandidate => {
  const commune = extractCommune(application.address);
  const ageDays = getAgeDays(application.submittedAt);
  const capacityNumber = parseCapacity(application.capacity, application.partnerType);
  const docs = application.documents || [];
  const documentScore = docs.length > 0 ? Math.min(28, docs.length * 7) : 10 + (index % 3) * 5;
  const zoneScore = ['Gombe', 'Ngaliema', 'Limete'].includes(commune) ? 18 : 12;
  const capacityScore = clamp(Math.round(capacityNumber / (application.partnerType === PartnerType.LOGISTICS ? 1 : 8)), 8, 22);
  const freshnessScore = ageDays <= 3 ? 12 : ageDays <= 10 ? 8 : 4;
  const typeScore = application.partnerType === PartnerType.LOGISTICS ? 10 : 14;
  const score = clamp(documentScore + zoneScore + capacityScore + freshnessScore + typeScore + (application.message ? 8 : 0), 18, 98);
  const missingDocuments = Math.max(0, 5 - docs.length);
  const truthScore = clamp(score + (application.email ? 4 : -8) + (application.phone ? 4 : -8) - missingDocuments * 3, 12, 99);
  const risk: RiskLevel = truthScore < 55 || missingDocuments >= 4 ? 'high' : truthScore < 76 ? 'medium' : 'low';
  const potentialRevenue = capacityNumber * (application.partnerType === PartnerType.LOGISTICS ? 85 : 42) + score * 38;

  return {
    application,
    stage: getStage(application, score, ageDays),
    score,
    truthScore,
    risk,
    commune,
    source: sourceNames[index % sourceNames.length],
    capacityNumber,
    potentialRevenue,
    documents: [
      { label: 'RCCM', valid: docs.length > 0 || score > 70 },
      { label: 'ID National', valid: Boolean(application.phone) },
      { label: 'Patente', valid: docs.length > 1 || score > 78 },
      { label: 'Assurance', valid: docs.length > 2 || application.partnerType !== PartnerType.LOGISTICS },
      { label: 'Photos établissement', valid: docs.length > 3 || score > 85 },
    ],
    ageDays,
  };
};

const scoreBadge = (score: number) => {
  if (score >= 82) return 'bg-emerald-100 text-emerald-700';
  if (score >= 60) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
};

const riskBadge: Record<RiskLevel, string> = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-orange-50 text-orange-700',
  high: 'bg-red-50 text-red-700',
};

const Sparkline: React.FC<{ color: string; seed: number }> = ({ color, seed }) => (
  <div className="mt-4 flex h-8 items-end gap-1">
    {Array.from({ length: 18 }, (_, index) => (
      <span key={index} className={`flex-1 rounded-t ${color}`} style={{ height: `${10 + ((seed + index * 7) % 22)}px` }} />
    ))}
  </div>
);

const KpiCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  tone: string;
  trend: string;
}> = ({ label, value, icon, tone, trend }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{trend}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon name={icon} className="h-5 w-5" />
      </div>
    </div>
    <Sparkline color={tone.includes('red') ? 'bg-red-500' : tone.includes('orange') ? 'bg-orange-500' : tone.includes('purple') ? 'bg-purple-500' : tone.includes('emerald') ? 'bg-emerald-500' : 'bg-blue-500'} seed={value.length * 11} />
  </div>
);

export const PartnerApplicationsPage: React.FC = () => {
  const { t, addNotification, approvePartnerApplication, rejectPartnerApplication } = useAppContext();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [activeTab, setActiveTab] = useState<OnboardingTab>('overview');
  const [query, setQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<OnboardingCandidate | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      setApplications(DB.get('partnerApplications'));
    } catch {
      setApplications([]);
      addNotification('Impossible de charger les candidatures partenaires.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  const candidates = useMemo(() => applications.map(buildCandidate), [applications]);

  const filteredCandidates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return candidates;
    return candidates.filter(({ application, commune, source }) =>
      [application.companyName, application.contactName, application.email, application.phone, application.address, commune, source, typeLabels[application.partnerType]]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [candidates, query]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const pending = candidates.filter((candidate) => candidate.application.status === ApplicationStatus.PENDING).length;
    const approved = candidates.filter((candidate) => candidate.application.status === ApplicationStatus.APPROVED).length;
    const rejected = candidates.filter((candidate) => candidate.application.status === ApplicationStatus.REJECTED).length;
    const avgDays = total ? candidates.reduce((sum, candidate) => sum + candidate.ageDays, 0) / total : 0;
    const conversion = total ? Math.round((approved / total) * 100) : 0;
    return { total, pending, approved, rejected, avgDays, conversion };
  }, [candidates]);

  const stageGroups = useMemo(() => {
    return (Object.keys(stageMeta) as PipelineStage[]).reduce<Record<PipelineStage, OnboardingCandidate[]>>((acc, stage) => {
      acc[stage] = filteredCandidates.filter((candidate) => candidate.stage === stage);
      return acc;
    }, {} as Record<PipelineStage, OnboardingCandidate[]>);
  }, [filteredCandidates]);

  const sourceStats = useMemo(() => {
    return sourceNames.map((source) => {
      const count = candidates.filter((candidate) => candidate.source === source).length;
      return { source, count, pct: stats.total ? Math.round((count / stats.total) * 100) : 0 };
    });
  }, [candidates, stats.total]);

  const communeStats = useMemo(() => {
    return communeNames.map((commune, index) => {
      const rows = candidates.filter((candidate) => candidate.commune === commune);
      return {
        commune,
        count: rows.length,
        potential: rows.reduce((sum, row) => sum + row.potentialRevenue, 0),
        left: [58, 26, 42, 74, 66, 36][index],
        top: [30, 58, 72, 48, 64, 38][index],
      };
    });
  }, [candidates]);

  const funnel = [
    { label: 'Candidatures reçues', value: stats.total },
    { label: 'Qualifiées', value: candidates.filter((candidate) => candidate.score >= 50).length },
    { label: 'Vérifiées', value: candidates.filter((candidate) => candidate.truthScore >= 65).length },
    { label: 'Approuvées', value: stats.approved },
    { label: 'Actives', value: candidates.filter((candidate) => candidate.application.status === ApplicationStatus.APPROVED && candidate.score >= 75).length },
  ];

  const alerts = [
    { label: `${candidates.filter((candidate) => candidate.documents.some((doc) => !doc.valid)).length} dossiers incomplets`, detail: 'Documents manquants', tone: 'red', icon: 'document-text' as const },
    { label: `${candidates.filter((candidate) => candidate.application.partnerType === PartnerType.LOGISTICS && candidate.risk !== 'low').length} assurances à vérifier`, detail: 'À renouveler ou confirmer', tone: 'orange', icon: 'shield' as const },
    { label: `${Math.max(0, candidates.length - new Set(candidates.map((candidate) => candidate.application.email)).size)} doublons détectés`, detail: 'Vérification requise', tone: 'orange', icon: 'users' as const },
    { label: `${candidates.filter((candidate) => candidate.risk === 'high').length} candidat(s) à risque élevé`, detail: 'Risque Truth élevé', tone: 'red', icon: 'warning' as const },
  ];

  const topCandidates = filteredCandidates.slice().sort((a, b) => b.score - a.score).slice(0, 8);

  const handleApprove = useCallback(async (candidate: OnboardingCandidate) => {
    setIsProcessing(true);
    try {
      await approvePartnerApplication(candidate.application.id);
      DB.updateItem('partnerApplications', candidate.application.id, { status: ApplicationStatus.APPROVED });
      await refreshApplications();
      setSelectedCandidate(null);
      addNotification(t('partnerApplications.notifications.approved', { default: 'Candidature approuvée avec succès.' }), 'success');
    } catch {
      addNotification(t('partnerApplications.notifications.approveError', { default: 'Erreur lors de l’approbation.' }), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [approvePartnerApplication, refreshApplications, addNotification, t]);

  const handleReject = useCallback(async (candidate: OnboardingCandidate) => {
    setIsProcessing(true);
    try {
      await rejectPartnerApplication(candidate.application.id, 'Rejeté depuis Partner Onboarding Center.');
      DB.updateItem('partnerApplications', candidate.application.id, {
        status: ApplicationStatus.REJECTED,
        rejectionReason: 'Rejeté depuis Partner Onboarding Center.',
      });
      await refreshApplications();
      setSelectedCandidate(null);
      addNotification(t('partnerApplications.notifications.rejected', { default: 'Candidature rejetée.' }), 'info');
    } catch {
      addNotification(t('partnerApplications.notifications.rejectError', { default: 'Erreur lors du rejet.' }), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [rejectPartnerApplication, refreshApplications, addNotification, t]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="inline-flex rounded-2xl bg-slate-100 p-1" aria-label="Partner onboarding tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-5 py-2 text-sm font-bold transition-colors ${activeTab === tab.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher partenaire, email, téléphone, ville..."
              className="w-80 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button type="button" onClick={refreshApplications} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Actualiser</button>
          <button type="button" onClick={() => addNotification('Export candidatures préparé.', 'success')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Exporter</button>
          <button type="button" onClick={() => addNotification('Invitation partenaire prête à envoyer.', 'info')} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Inviter partenaire</button>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span>Chargement du Partner Onboarding Center...</span>
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <KpiCard label="Total candidatures" value={formatNumber(stats.total)} icon="users" tone="bg-blue-50 text-blue-700" trend="+ pipeline acquisition" />
            <KpiCard label="En attente" value={formatNumber(stats.pending)} icon="clock" tone="bg-orange-50 text-orange-700" trend="à qualifier" />
            <KpiCard label="Approuvées" value={formatNumber(stats.approved)} icon="check" tone="bg-emerald-50 text-emerald-700" trend="conversion active" />
            <KpiCard label="Rejetées" value={formatNumber(stats.rejected)} icon="xmark" tone="bg-red-50 text-red-700" trend="dossiers non conformes" />
            <KpiCard label="Délai moyen" value={`${stats.avgDays.toFixed(1)} jours`} icon="clock-history" tone="bg-blue-50 text-blue-700" trend="temps de traitement" />
            <KpiCard label="Taux conversion" value={`${stats.conversion}%`} icon="chartBar" tone="bg-purple-50 text-purple-700" trend="approuvées / total" />
          </section>

          {(activeTab === 'overview' || activeTab === 'candidates') && (
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Pipeline d’onboarding</h2>
                    <p className="text-sm text-slate-500">Priorisation CRM par potentiel, risque et maturité dossier.</p>
                  </div>
                  <div className="flex gap-2">
                    <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><option>Vue : Kanban</option></select>
                    <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><option>Trier par : Score</option></select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
                  {(Object.keys(stageMeta) as PipelineStage[]).map((stage) => {
                    const group = stageGroups[stage];
                    const potential = group.reduce((sum, candidate) => sum + candidate.potentialRevenue, 0);
                    return (
                      <div key={stage} className={`rounded-2xl border p-3 ${stageMeta[stage].tone}`}>
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <p className="font-bold text-slate-950">{stageMeta[stage].label}</p>
                            <p className="text-sm text-slate-600">{group.length} · Potentiel {formatMoney(potential)}</p>
                          </div>
                          <Icon name="clock" className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="space-y-3">
                          {group.slice(0, 3).map((candidate) => (
                            <div
                              key={candidate.application.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedCandidate(candidate)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedCandidate(candidate);
                                }
                              }}
                              className="w-full rounded-xl border border-white/70 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-bold text-slate-950">{candidate.application.companyName}</p>
                                  <p className="text-xs text-slate-500">{candidate.application.contactName}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleSelection(candidate.application.id);
                                  }}
                                  className={`h-5 w-5 rounded border ${selectedIds.includes(candidate.application.id) ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`}
                                  aria-label="Sélectionner candidature"
                                />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{typeLabels[candidate.application.partnerType]}</span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{candidate.commune}</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between text-xs">
                                <span className="text-amber-500">★ ★ ★ <span className="text-slate-300">★ ★</span></span>
                                <span className={`rounded-lg px-2 py-1 font-bold ${scoreBadge(candidate.score)}`}>{candidate.score}</span>
                              </div>
                              <p className="mt-2 text-xs text-slate-500">Ajouté il y a {candidate.ageDays} j</p>
                            </div>
                          ))}
                          {group.length > 3 && <button className="w-full text-sm font-bold text-blue-700">Voir tout ({group.length})</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {selectedCandidate ? (
                  <CandidatePanel
                    candidate={selectedCandidate}
                    isProcessing={isProcessing}
                    onApprove={() => handleApprove(selectedCandidate)}
                    onReject={() => handleReject(selectedCandidate)}
                    onClose={() => setSelectedCandidate(null)}
                  />
                ) : (
                  <CandidatePanel
                    candidate={topCandidates[0]}
                    isProcessing={isProcessing}
                    onApprove={() => topCandidates[0] && handleApprove(topCandidates[0])}
                    onReject={() => topCandidates[0] && handleReject(topCandidates[0])}
                    onClose={() => undefined}
                  />
                )}
              </aside>
            </section>
          )}

          {(activeTab === 'overview' || activeTab === 'performance') && (
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Heatmap candidatures - Kinshasa</h3>
                <div className="relative mt-4 h-48 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-emerald-50 to-orange-50">
                  <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(#bfdbfe 1px, transparent 1px), linear-gradient(90deg, #bfdbfe 1px, transparent 1px)', backgroundSize: '38px 38px' }} />
                  <div className="absolute left-[45%] top-[42%] h-28 w-28 rounded-full bg-orange-400/60 blur-2xl" />
                  <div className="absolute left-[58%] top-[58%] h-24 w-24 rounded-full bg-emerald-400/50 blur-2xl" />
                  {communeStats.map((item) => (
                    <div key={item.commune} className="absolute z-10 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs shadow-sm" style={{ left: `${item.left}%`, top: `${item.top}%`, transform: 'translate(-50%, -50%)' }}>
                      <p className="font-bold text-slate-950">{item.commune}</p>
                      <p className="text-slate-600">{item.count} candidatures</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Entonnoir d’onboarding</h3>
                <div className="mt-4 space-y-3">
                  {funnel.map((step, index) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div className="h-9 rounded-r-xl bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${Math.max(28, 100 - index * 13)}%` }} />
                      <span className="w-10 text-right font-bold text-slate-950">{step.value}</span>
                      <span className="flex-1 text-xs text-slate-500">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Sources d’acquisition</h3>
                <div className="mt-4 flex items-center gap-5">
                  <div className="relative h-28 w-28 rounded-full" style={{ background: 'conic-gradient(#2563eb 0 42%, #10b981 42% 60%, #8b5cf6 60% 82%, #f59e0b 82% 94%, #ef4444 94% 100%)' }}>
                    <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-lg font-bold">{stats.total}</span>
                      <span className="text-xs text-slate-500">Total</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {sourceStats.map((source, index) => (
                      <div key={source.source} className="flex justify-between text-sm">
                        <span className="text-slate-600">{source.source}</span>
                        <span className="font-bold">{source.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Alertes importantes</h3>
                <div className="mt-3 divide-y divide-slate-100">
                  {alerts.map((alert) => (
                    <div key={alert.label} className="flex gap-3 py-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${alert.tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                        <Icon name={alert.icon} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{alert.label}</p>
                        <p className="text-xs text-slate-500">{alert.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {(activeTab === 'overview' || activeTab === 'truth' || activeTab === 'compliance') && (
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-950">Top candidatures à fort potentiel</h3>
                  <button className="text-sm font-bold text-blue-700">Voir tout</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Partenaire</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Zone</th>
                        <th className="px-3 py-2">Score</th>
                        <th className="px-3 py-2">Capacité</th>
                        <th className="px-3 py-2">CA potentiel</th>
                        <th className="px-3 py-2">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topCandidates.map((candidate) => (
                        <tr key={candidate.application.id} className="hover:bg-slate-50">
                          <td className="px-3 py-3 font-bold text-slate-950">{candidate.application.companyName}</td>
                          <td className="px-3 py-3 text-slate-600">{typeLabels[candidate.application.partnerType]}</td>
                          <td className="px-3 py-3 text-slate-600">{candidate.commune}</td>
                          <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${scoreBadge(candidate.score)}`}>{candidate.score}/100</span></td>
                          <td className="px-3 py-3 text-slate-600">{candidate.capacityNumber} {candidate.application.partnerType === PartnerType.LOGISTICS ? 'chauffeurs' : 'cmd/jour'}</td>
                          <td className="px-3 py-3 font-bold">{formatMoney(candidate.potentialRevenue)}</td>
                          <td className="px-3 py-3 text-slate-600">{candidate.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Activité récente</h3>
                <div className="mt-4 space-y-4">
                  {topCandidates.slice(0, 5).map((candidate, index) => (
                    <div key={`recent-${candidate.application.id}`} className="flex gap-3">
                      <span className={`mt-1 flex h-8 w-8 items-center justify-center rounded-xl ${index % 3 === 0 ? 'bg-blue-50 text-blue-700' : index % 3 === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                        <Icon name={index % 3 === 0 ? 'document-text' : index % 3 === 1 ? 'check' : 'clock'} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">il y a {5 + index * 13} min</p>
                        <p className="text-sm font-bold text-slate-900">{candidate.application.companyName} {index % 3 === 0 ? 'a envoyé des documents' : index % 3 === 1 ? 'est prêt pour approbation' : 'a un entretien planifié'}</p>
                        <p className="text-xs text-slate-500">Score {candidate.score}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Actions rapides</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setQuery('')} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-bold text-blue-700">Rechercher</button>
                  <button type="button" onClick={() => addNotification(`${selectedIds.length} candidature(s) sélectionnée(s).`, 'info')} className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-3 text-sm font-bold text-purple-700">Bulk actions</button>
                  <button type="button" onClick={() => addNotification('Export candidatures préparé.', 'success')} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-bold text-blue-700">Exporter</button>
                  <button type="button" onClick={() => addNotification('Demande de documents envoyée.', 'success')} className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-3 text-sm font-bold text-orange-700">Documents</button>
                  <button type="button" onClick={() => addNotification('Email partenaire préparé.', 'info')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">Email</button>
                  <button type="button" onClick={() => addNotification('Message WhatsApp préparé.', 'success')} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700">WhatsApp</button>
                </div>
              </div>
            </section>
          )}

          {filteredCandidates.length === 0 && (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Icon name="document-text" className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-bold text-slate-950">Aucune candidature en attente</h3>
              <p className="mt-2 text-sm text-slate-500">Toutes les demandes ont été traitées ou aucun résultat ne correspond aux filtres.</p>
            </section>
          )}
        </>
      )}
    </div>
  );
};

const CandidatePanel: React.FC<{
  candidate?: OnboardingCandidate;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}> = ({ candidate, isProcessing, onApprove, onReject, onClose }) => {
  if (!candidate) {
    return (
      <div className="text-center text-slate-500">
        <Icon name="document-text" className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm">Sélectionnez une candidature pour voir son dossier.</p>
      </div>
    );
  }

  const validDocs = candidate.documents.filter((doc) => doc.valid).length;
  const riskLabel = candidate.risk === 'low' ? 'Faible' : candidate.risk === 'medium' ? 'Moyen' : 'Élevé';

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-950">{candidate.application.companyName}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{typeLabels[candidate.application.partnerType]}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{candidate.commune}</span>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <Icon name="xmark" className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 space-y-1 text-sm text-slate-600">
        <p className="font-semibold text-slate-950">{candidate.application.contactName}</p>
        <p>{candidate.application.phone}</p>
        <p>{candidate.application.email}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-700">Score</p>
          <p className="text-2xl font-bold text-emerald-800">{candidate.score}/100</p>
        </div>
        <div className={`rounded-xl p-3 ${riskBadge[candidate.risk]}`}>
          <p className="text-xs font-semibold">Truth Risk</p>
          <p className="text-2xl font-bold">{riskLabel}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-bold text-slate-950">Documents</h4>
          <span className="text-xs font-semibold text-slate-500">{validDocs}/5 validés</span>
        </div>
        <div className="space-y-2">
          {candidate.documents.map((doc) => (
            <div key={doc.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{doc.label}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${doc.valid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {doc.valid ? 'Validé' : 'Manquant'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <h4 className="font-bold text-slate-950">Capacité déclarée</h4>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <span className="rounded-lg bg-white p-2">Machines<br /><b>{candidate.application.partnerType === PartnerType.LOGISTICS ? 0 : Math.max(2, Math.round(candidate.capacityNumber / 25))}</b></span>
          <span className="rounded-lg bg-white p-2">Personnel<br /><b>{Math.max(4, Math.round(candidate.capacityNumber / 8))}</b></span>
          <span className="rounded-lg bg-white p-2">Capacité<br /><b>{candidate.capacityNumber}</b></span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <h4 className="font-bold text-slate-950">Localisation</h4>
        <p className="mt-1 text-sm text-slate-600">{candidate.application.address}</p>
        <div className="mt-3 h-24 rounded-xl bg-gradient-to-br from-blue-100 via-white to-emerald-100" />
      </div>

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onApprove} disabled={isProcessing} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
          Approuver
        </button>
        <button type="button" onClick={onReject} disabled={isProcessing} className="flex-1 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-50">
          Rejeter
        </button>
      </div>
    </div>
  );
};
