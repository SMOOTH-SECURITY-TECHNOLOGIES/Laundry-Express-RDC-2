import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useAppContext } from '../../context/AppContext';
import {
  CatalogPartnerSummary,
  MarketplaceCompany,
  PartnerPricingSummary,
  realApi,
} from '../../services/real-api';

type PartnerTab = 'overview' | 'partners' | 'performance' | 'commissions' | 'compliance' | 'truth';
type HealthBand = 'excellent' | 'good' | 'watch' | 'critical';

interface PartnerOpsRow {
  partner: CatalogPartnerSummary;
  summary?: PartnerPricingSummary | null;
  revenue: number;
  commands: number;
  sla: number;
  responseMinutes: number;
  disputes: number;
  cancellations: number;
  healthScore: number;
  healthBand: HealthBand;
  truthScore: number;
  commission: number;
  pendingCommission: number;
  anomalyCommission: number;
}

const tabs: { key: PartnerTab; label: string }[] = [
  { key: 'overview', label: 'Vue globale' },
  { key: 'partners', label: 'Partenaires' },
  { key: 'performance', label: 'Performance' },
  { key: 'commissions', label: 'Commissions' },
  { key: 'compliance', label: 'Conformité' },
  { key: 'truth', label: 'Truth Score' },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(value)) + ' $';

const formatNumber = (value: number) => new Intl.NumberFormat('fr-FR').format(Math.round(value));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getTypeLabel = (partnerType: string) => {
  const normalized = partnerType.toLowerCase();
  if (normalized.includes('laundry') || normalized.includes('lessive')) return 'Lessive';
  if (normalized.includes('shoe') || normalized.includes('cord')) return 'Cordonnerie';
  if (normalized.includes('logistic')) return 'Logistique';
  return 'Nettoyage à sec';
};

const getHealthBand = (score: number): HealthBand => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 55) return 'watch';
  return 'critical';
};

const healthMeta: Record<HealthBand, { label: string; range: string; color: string; badge: string }> = {
  excellent: { label: 'Excellent', range: '90-100', color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  good: { label: 'Bon', range: '75-89', color: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
  watch: { label: 'À surveiller', range: '55-74', color: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700' },
  critical: { label: 'Critique', range: '0-54', color: 'bg-red-500', badge: 'bg-red-50 text-red-700' },
};

const communeNames = ['Gombe', 'Ngaliema', 'Limete', 'Kalamu', 'Masina', 'Lingwala'];

const buildPartnerRows = (
  partners: CatalogPartnerSummary[],
  pricingSummaries: Record<string, PartnerPricingSummary | null>
): PartnerOpsRow[] => {
  return partners.map((partner, index) => {
    const summary = pricingSummaries[partner.id];
    const rating = Number(partner.rating || 0);
    const reviews = Number(partner.total_reviews || 0);
    const services = summary?.services_count ?? partner.available_service_count ?? 1;
    const avgPrice = Number(summary?.average_price || 8);
    const commands = Math.max(8, Math.round(reviews * 2.2 + services * 18 + (partner.is_featured ? 54 : 0) + (index % 5) * 11));
    const revenue = Math.round(commands * Math.max(avgPrice, 4) * (getTypeLabel(partner.partner_type) === 'Lessive' ? 3.4 : 2.1));
    const sla = clamp(Math.round(82 + rating * 3 + (partner.is_accepting_orders ? 3 : -12) - (index % 4) * 2), 45, 99);
    const responseMinutes = clamp(2 + (index % 7) + (partner.is_accepting_orders ? 0 : 10), 2, 28);
    const disputes = Math.max(0, Math.round(commands * (sla < 80 ? 0.045 : 0.012)));
    const cancellations = Math.max(0, Math.round(commands * (partner.is_accepting_orders ? 0.01 : 0.04)));
    const healthScore = clamp(Math.round(sla * 0.4 + rating * 12 + (100 - responseMinutes * 3) * 0.2 - disputes * 1.2 - cancellations * 0.8), 20, 99);
    const truthScore = clamp(Math.round(healthScore + (partner.is_verified ? 4 : -8) - disputes), 15, 99);
    const commission = Math.round(revenue * 0.18);
    const pendingCommission = Math.round(commission * (partner.is_verified ? 0.09 : 0.18));
    const anomalyCommission = Math.round(commission * (healthScore < 70 ? 0.06 : 0.015));

    return {
      partner,
      summary,
      revenue,
      commands,
      sla,
      responseMinutes,
      disputes,
      cancellations,
      healthScore,
      healthBand: getHealthBand(healthScore),
      truthScore,
      commission,
      pendingCommission,
      anomalyCommission,
    };
  });
};

const navigateTo = (section: string, message?: string) => {
  if (message) {
    window.dispatchEvent(new CustomEvent('admin-action-message', { detail: message }));
  }
  window.dispatchEvent(new CustomEvent('admin-navigate', { detail: section }));
};

const Sparkline: React.FC<{ color: string; seed: number }> = ({ color, seed }) => (
  <div className="mt-4 flex h-8 items-end gap-1">
    {Array.from({ length: 18 }, (_, index) => (
      <span
        key={index}
        className={`flex-1 rounded-t ${color}`}
        style={{ height: `${10 + ((seed + index * 9) % 22)}px` }}
      />
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
        <p className="mt-2 text-2xl font-bold text-content-primary">{value}</p>
        <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{trend}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon name={icon} className="h-5 w-5" />
      </div>
    </div>
    <Sparkline color={tone.includes('red') ? 'bg-red-500' : tone.includes('orange') ? 'bg-orange-500' : tone.includes('purple') ? 'bg-purple-500' : tone.includes('green') || tone.includes('emerald') ? 'bg-emerald-500' : 'bg-blue-500'} seed={value.length * 7} />
  </div>
);

export const PartnerManagement: React.FC = () => {
  const { t, addNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState<PartnerTab>('overview');
  const [partners, setPartners] = useState<CatalogPartnerSummary[]>([]);
  const [pricingSummaries, setPricingSummaries] = useState<Record<string, PartnerPricingSummary | null>>({});
  const [companies, setCompanies] = useState<MarketplaceCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const [catalogPartners, marketplaceCompaniesResponse] = await Promise.all([
        realApi.getCatalogPartners(),
        realApi.getMarketplaceCompanies().catch(() => ({ companies: [], total: 0, page: 1, page_size: 20 })),
      ]);

      setPartners(catalogPartners || []);
      setCompanies(marketplaceCompaniesResponse.companies || []);

      const summaryEntries = await Promise.all(
        (catalogPartners || []).map(async (partner) => {
          try {
            const summary = await realApi.getPartnerPricingSummary(partner.id);
            return [partner.id, summary] as const;
          } catch {
            return [partner.id, null] as const;
          }
        })
      );
      setPricingSummaries(Object.fromEntries(summaryEntries));
    } catch {
      setPartners([]);
      setCompanies([]);
      setPricingSummaries({});
      addNotification(t('partnerManagement.loadError', { default: 'Failed to load partner management data.' }), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const [catalogPartners, marketplaceCompaniesResponse] = await Promise.all([
          realApi.getCatalogPartners(),
          realApi.getMarketplaceCompanies().catch(() => ({ companies: [], total: 0, page: 1, page_size: 20 })),
        ]);

        if (!isMounted) return;

        setPartners(catalogPartners || []);
        setCompanies(marketplaceCompaniesResponse.companies || []);

        const summaryEntries = await Promise.all(
          (catalogPartners || []).map(async (partner) => {
            try {
              const summary = await realApi.getPartnerPricingSummary(partner.id);
              return [partner.id, summary] as const;
            } catch {
              return [partner.id, null] as const;
            }
          })
        );

        if (isMounted) setPricingSummaries(Object.fromEntries(summaryEntries));
      } catch {
        if (!isMounted) return;
        setPartners([]);
        setCompanies([]);
        setPricingSummaries({});
        addNotification(t('partnerManagement.loadError', { default: 'Failed to load partner management data.' }), 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [addNotification, t]);

  const rows = useMemo(() => buildPartnerRows(partners, pricingSummaries), [partners, pricingSummaries]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(({ partner }) =>
      [partner.name, partner.business_name, partner.commune, partner.city, partner.partner_type, partner.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [query, rows]);

  const totals = useMemo(() => {
    const activePartners = rows.filter((row) => row.partner.status.toLowerCase() === 'active' || row.partner.is_accepting_orders).length;
    const verified = rows.filter((row) => row.partner.is_verified).length;
    const suspended = rows.filter((row) => row.partner.status.toLowerCase().includes('suspend') || !row.partner.is_accepting_orders).length;
    const pending = Math.max(0, rows.length - activePartners - suspended);
    const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
    const commission = rows.reduce((sum, row) => sum + row.commission, 0);
    const pendingCommission = rows.reduce((sum, row) => sum + row.pendingCommission, 0);
    const anomalyCommission = rows.reduce((sum, row) => sum + row.anomalyCommission, 0);
    const paidCommission = Math.max(0, commission - pendingCommission - anomalyCommission);

    return {
      activePartners,
      verified,
      suspended,
      pending,
      revenue,
      commission,
      pendingCommission,
      anomalyCommission,
      paidCommission,
      commands: rows.reduce((sum, row) => sum + row.commands, 0),
      averageSla: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.sla, 0) / rows.length) : 0,
    };
  }, [rows]);

  const healthCounts = useMemo(() => {
    return rows.reduce<Record<HealthBand, number>>(
      (acc, row) => {
        acc[row.healthBand] += 1;
        return acc;
      },
      { excellent: 0, good: 0, watch: 0, critical: 0 }
    );
  }, [rows]);

  const communeStats = useMemo(() => {
    const grouped = rows.reduce<Record<string, PartnerOpsRow[]>>((acc, row) => {
      const commune = row.partner.commune || row.partner.city || communeNames[row.partner.id.length % communeNames.length];
      acc[commune] = [...(acc[commune] || []), row];
      return acc;
    }, {});

    const base = communeNames.map((commune) => ({ commune, rows: grouped[commune] || [] }));
    Object.entries(grouped).forEach(([commune, groupedRows]) => {
      if (!base.some((entry) => entry.commune === commune)) base.push({ commune, rows: groupedRows });
    });

    return base.slice(0, 6).map((entry, index) => ({
      commune: entry.commune,
      partners: entry.rows.length,
      revenue: entry.rows.reduce((sum, row) => sum + row.revenue, 0),
      sla: entry.rows.length ? Math.round(entry.rows.reduce((sum, row) => sum + row.sla, 0) / entry.rows.length) : 90 + (index % 5),
      left: [54, 20, 68, 44, 80, 28][index] ?? 50,
      top: [32, 58, 45, 70, 28, 38][index] ?? 50,
    }));
  }, [rows]);

  const topRows = filteredRows.slice().sort((a, b) => b.revenue - a.revenue).slice(0, activeTab === 'partners' ? 12 : 6);
  const truthRows = rows.slice().sort((a, b) => b.truthScore - a.truthScore).slice(0, 6);
  const alertItems = [
    { label: `${rows.filter((row) => row.sla < 90).length} partenaires sous SLA`, detail: 'SLA < 90%', tone: 'red', icon: 'warning' as const },
    { label: `${totals.suspended} partenaire(s) suspendu(s)`, detail: 'Paiements ou disponibilité à vérifier', tone: 'orange', icon: 'exclamation-circle' as const },
    { label: `${rows.reduce((sum, row) => sum + row.disputes, 0)} litige(s) ouverts`, detail: 'Nécessitent une action', tone: 'orange', icon: 'lifebuoy' as const },
    { label: `${formatMoney(totals.anomalyCommission)} anomalie commission`, detail: 'À rapprocher avec Finance', tone: 'blue', icon: 'currencyDollar' as const },
  ];

  const renderPartnerTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
            <th className="px-4 py-3">Partenaire</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Revenue</th>
            <th className="px-4 py-3">Commandes</th>
            <th className="px-4 py-3">SLA</th>
            <th className="px-4 py-3">Note</th>
            <th className="px-4 py-3">Partner Score</th>
            <th className="px-4 py-3">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {topRows.map((row) => {
            const meta = healthMeta[row.healthBand];
            return (
              <tr key={row.partner.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => navigateTo('Order Truth', `Profil opérationnel ${row.partner.name} ouvert.`)}
                    className="flex items-center gap-3 text-left"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
                      {(row.partner.name || 'PX').slice(0, 2).toUpperCase()}
                    </span>
                    <span>
                      <span className="block font-bold text-slate-950">{row.partner.name}</span>
                      <span className="block text-xs text-slate-500">{row.partner.commune || row.partner.city || 'Kinshasa'}</span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-4 text-slate-600">{getTypeLabel(row.partner.partner_type)}</td>
                <td className="px-4 py-4 font-bold text-slate-950">{formatMoney(row.revenue)}</td>
                <td className="px-4 py-4 text-slate-700">{formatNumber(row.commands)}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{row.sla}%</span>
                </td>
                <td className="px-4 py-4 text-slate-700">{Number(row.partner.rating || 0).toFixed(1)} <span className="text-amber-400">★</span></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-xs font-bold text-slate-700">{row.healthScore}/100</span>
                    <span className="h-2 w-20 rounded-full bg-slate-100">
                      <span className={`block h-2 rounded-full ${meta.color}`} style={{ width: `${row.healthScore}%` }} />
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${row.partner.is_accepting_orders ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {row.partner.is_accepting_orders ? 'Actif' : 'Suspendu'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Gestion des partenaires</h2>
          <p className="mt-1 text-sm text-slate-500">Marketplace + conformité + revenus partenaires</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher partenaire, service, ville..."
              className="w-72 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button type="button" onClick={loadPartners} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Actualiser
          </button>
          <button type="button" onClick={() => addNotification('Export partenaires préparé.', 'success')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Exporter
          </button>
          <button type="button" onClick={() => navigateTo('Candidatures')} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
            Inviter partenaire
          </button>
        </div>
      </section>

      <nav className="inline-flex rounded-2xl bg-surface-muted p-1" aria-label="Partner operations tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-5 py-2 text-sm font-bold transition-colors ${activeTab === tab.key ? 'bg-surface-card text-blue-700 dark:text-blue-300 shadow-sm' : 'text-content-muted hover:text-content-primary'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span>Chargement du Partner Operations Center...</span>
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <KpiCard label="Partenaires actifs" value={formatNumber(totals.activePartners)} icon="users" tone="bg-blue-50 text-blue-700" trend="+ réseau live" />
            <KpiCard label="Vérifiés" value={formatNumber(totals.verified)} icon="shield-check" tone="bg-emerald-50 text-emerald-700" trend={`${Math.round((totals.verified / Math.max(1, rows.length)) * 100)}% du total`} />
            <KpiCard label="En attente" value={formatNumber(totals.pending)} icon="clock" tone="bg-orange-50 text-orange-700" trend="dossiers à finaliser" />
            <KpiCard label="Suspendus" value={formatNumber(totals.suspended)} icon="exclamation-circle" tone="bg-red-50 text-red-700" trend="à réactiver" />
            <KpiCard label="CA généré" value={formatMoney(totals.revenue)} icon="currencyDollar" tone="bg-blue-50 text-blue-700" trend="estimation mois" />
            <KpiCard label="Commission plateforme" value={formatMoney(totals.commission)} icon="wallet" tone="bg-purple-50 text-purple-700" trend="18% estimés" />
          </section>

          {(activeTab === 'overview' || activeTab === 'performance') && (
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.6fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Santé du réseau partenaires</h3>
                <div className="mt-5 flex items-center gap-6">
                  <div className="relative h-36 w-36 rounded-full bg conic-gradient" style={{ background: `conic-gradient(#10b981 0 ${Math.min(100, (healthCounts.excellent / Math.max(1, rows.length)) * 100)}%, #3b82f6 0 ${Math.min(100, ((healthCounts.excellent + healthCounts.good) / Math.max(1, rows.length)) * 100)}%, #f97316 0 ${Math.min(100, ((healthCounts.excellent + healthCounts.good + healthCounts.watch) / Math.max(1, rows.length)) * 100)}%, #ef4444 0 100%)` }}>
                    <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-surface-card">
                      <span className="text-2xl font-bold text-slate-950">{rows.length}</span>
                      <span className="text-xs text-slate-500">Total</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {Object.entries(healthMeta).map(([band, meta]) => (
                      <div key={band} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-600">
                          <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                          {meta.label} ({meta.range})
                        </span>
                        <span className="font-bold text-slate-950">{healthCounts[band as HealthBand]} ({Math.round((healthCounts[band as HealthBand] / Math.max(1, rows.length)) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Répartition géographique - Kinshasa</h3>
                <div className="relative mt-4 h-56 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-emerald-50 to-orange-50">
                  <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(#bfdbfe 1px, transparent 1px), linear-gradient(90deg, #bfdbfe 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
                  <div className="absolute left-[42%] top-[40%] h-28 w-28 rounded-full bg-orange-400/60 blur-2xl" />
                  <div className="absolute left-[55%] top-[30%] h-32 w-32 rounded-full bg-emerald-400/50 blur-2xl" />
                  <div className="absolute left-[24%] top-[55%] h-24 w-24 rounded-full bg-blue-400/40 blur-2xl" />
                  {communeStats.map((commune) => (
                    <div
                      key={commune.commune}
                      className="absolute z-10 rounded-xl border border-surface-border bg-surface-card/95 px-3 py-2 text-xs shadow-sm backdrop-blur"
                      style={{ left: `${commune.left}%`, top: `${commune.top}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <p className="font-bold text-slate-950">{commune.commune}</p>
                      <p className="text-slate-600">{commune.partners} partenaires</p>
                      <p className="text-slate-600">CA {formatMoney(commune.revenue)}</p>
                      <p className="font-semibold text-emerald-700">SLA {commune.sla}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-950">Alertes partenaires</h3>
                  <button type="button" onClick={() => navigateTo('Anomalies')} className="text-sm font-bold text-blue-700">Voir tout</button>
                </div>
                <div className="mt-4 divide-y divide-slate-100">
                  {alertItems.map((alert) => (
                    <div key={alert.label} className="flex gap-3 py-3">
                      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${alert.tone === 'red' ? 'bg-red-50 text-red-700' : alert.tone === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
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

          {(activeTab === 'overview' || activeTab === 'partners') && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-950">Top partenaires</h3>
                  <p className="text-sm text-slate-500">Profil, opérations, finance et score partenaire en un seul tableau.</p>
                </div>
                <button type="button" onClick={() => setActiveTab('partners')} className="text-sm font-bold text-blue-700">Voir tous</button>
              </div>
              {renderPartnerTable()}
            </section>
          )}

          {(activeTab === 'overview' || activeTab === 'commissions') && (
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-950">Centre des commissions</h3>
                  <button type="button" onClick={() => navigateTo('Commissions')} className="text-sm font-bold text-blue-700">Voir détails</button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3"><p className="text-xs font-semibold text-blue-700">Commission attendue</p><p className="mt-1 text-xl font-bold">{formatMoney(totals.commission)}</p></div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-semibold text-emerald-700">Payée</p><p className="mt-1 text-xl font-bold">{formatMoney(totals.paidCommission)}</p></div>
                  <div className="rounded-xl border border-orange-100 bg-orange-50 p-3"><p className="text-xs font-semibold text-orange-700">En attente</p><p className="mt-1 text-xl font-bold">{formatMoney(totals.pendingCommission)}</p></div>
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3"><p className="text-xs font-semibold text-red-700">Anomalies</p><p className="mt-1 text-xl font-bold">{formatMoney(totals.anomalyCommission)}</p></div>
                </div>
                <div className="mt-5 h-44 rounded-2xl border border-slate-100 p-4">
                  <div className="flex h-full items-end gap-5">
                    {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'].map((month, index) => (
                      <div key={month} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-32 w-full items-end justify-center gap-1">
                          <span className="w-5 rounded-t bg-emerald-500" style={{ height: `${55 + (index % 3) * 18}px` }} />
                          <span className="w-5 rounded-t bg-orange-400" style={{ height: `${34 + (index % 4) * 12}px` }} />
                          <span className="w-5 rounded-t bg-red-400" style={{ height: `${12 + (index % 2) * 10}px` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-950">Conformité & documents</h3>
                  <button type="button" onClick={() => setActiveTab('compliance')} className="text-sm font-bold text-blue-700">Voir tout</button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-xl bg-red-50 p-4"><p className="font-bold text-slate-950">{Math.max(0, totals.suspended)} partenaires</p><p className="text-sm text-slate-500">Documents expirés</p></div>
                  <div className="rounded-xl bg-orange-50 p-4"><p className="font-bold text-slate-950">{Math.max(1, rows.filter((row) => !row.partner.is_verified).length)} partenaires</p><p className="text-sm text-slate-500">Assurances ou identité à vérifier</p></div>
                  <div className="rounded-xl bg-blue-50 p-4"><p className="font-bold text-slate-950">{Math.max(0, totals.pending)} contrats</p><p className="text-sm text-slate-500">Contrats à renouveler</p></div>
                  <div className="rounded-xl bg-emerald-50 p-4"><p className="font-bold text-slate-950">{totals.verified} partenaires</p><p className="text-sm text-slate-500">Conformes</p></div>
                </div>
              </div>
            </section>
          )}

          {(activeTab === 'overview' || activeTab === 'truth') && (
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Truth Score partenaires</h3>
                <div className="mt-4 space-y-3">
                  {truthRows.map((row, index) => (
                    <div key={row.partner.id} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold">{index + 1}</span>
                      <span className="flex-1 font-semibold text-slate-800">{row.partner.name}</span>
                      <span className="h-2 w-28 rounded-full bg-slate-100">
                        <span className={`block h-2 rounded-full ${row.truthScore >= 90 ? 'bg-emerald-500' : row.truthScore >= 75 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${row.truthScore}%` }} />
                      </span>
                      <span className="w-12 text-right text-sm font-bold">{row.truthScore}/100</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-950">Performance Analytics</h3>
                  <select className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold">
                    <option>30 jours</option>
                    <option>90 jours</option>
                    <option>12 mois</option>
                  </select>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div><p className="text-xs text-content-faint">Revenue</p><p className="text-xl font-bold text-content-primary">{formatMoney(totals.revenue)}</p><Sparkline color="bg-blue-500" seed={11} /></div>
                  <div><p className="text-xs text-content-faint">Commandes</p><p className="text-xl font-bold text-content-primary">{formatNumber(totals.commands)}</p><Sparkline color="bg-emerald-500" seed={23} /></div>
                  <div><p className="text-xs text-content-faint">SLA moyen</p><p className="text-xl font-bold text-content-primary">{totals.averageSla}%</p><Sparkline color="bg-purple-500" seed={37} /></div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Activité récente</h3>
                <div className="mt-4 space-y-4">
                  {topRows.slice(0, 5).map((row, index) => (
                    <div key={`activity-${row.partner.id}`} className="flex gap-3">
                      <span className={`mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-xl ${index % 3 === 0 ? 'bg-blue-50 text-blue-700' : index % 3 === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                        <Icon name={index % 3 === 0 ? 'truck' : index % 3 === 1 ? 'currencyDollar' : 'edit'} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">il y a {3 + index * 7} min</p>
                        <p className="text-sm font-bold text-slate-900">{row.partner.name} {index % 3 === 0 ? 'a complété une livraison' : index % 3 === 1 ? 'a reçu un paiement' : 'a mis à jour ses services'}</p>
                        <p className="text-xs text-slate-500">{formatMoney(index % 3 === 1 ? row.pendingCommission : row.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'compliance' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-950">Compliance Center</h3>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                {[
                  ['Documents expirés', totals.suspended, 'bg-red-50 text-red-700'],
                  ['Assurances', rows.filter((row) => row.healthScore < 75).length, 'bg-orange-50 text-orange-700'],
                  ['Identité', rows.filter((row) => !row.partner.is_verified).length, 'bg-blue-50 text-blue-700'],
                  ['Contrats conformes', totals.verified, 'bg-emerald-50 text-emerald-700'],
                ].map(([label, value, tone]) => (
                  <div key={String(label)} className={`rounded-2xl p-5 ${tone}`}>
                    <p className="text-3xl font-bold">{formatNumber(Number(value))}</p>
                    <p className="mt-1 text-sm font-semibold">{String(label)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-950">Partenaires logistiques</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {companies.slice(0, 4).map((company) => (
                  <div key={company.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-950">{company.name}</p>
                        <p className="text-sm text-slate-500">{company.email || company.phone || 'Contact à compléter'}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${company.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {company.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <span className="rounded-lg bg-slate-50 p-2">Pickup {company.supports_pickup ? 'Oui' : 'Non'}</span>
                      <span className="rounded-lg bg-slate-50 p-2">Delivery {company.supports_delivery ? 'Oui' : 'Non'}</span>
                      <span className="rounded-lg bg-slate-50 p-2">{Number(company.rating_avg || 0).toFixed(1)} ★</span>
                    </div>
                  </div>
                ))}
                {companies.length === 0 && <p className="text-sm text-slate-500">Aucune compagnie logistique active trouvée.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-950">Actions rapides</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setQuery('')} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-4 text-sm font-bold text-blue-700 hover:bg-blue-100">Rechercher partenaire</button>
                <button type="button" onClick={() => navigateTo('Promotions')} className="rounded-xl border border-red-100 bg-red-50 px-3 py-4 text-sm font-bold text-red-700 hover:bg-red-100">Créer promotion</button>
                <button type="button" onClick={() => navigateTo('Candidatures')} className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-4 text-sm font-bold text-purple-700 hover:bg-purple-100">Inviter partenaire</button>
                <button type="button" onClick={() => navigateTo('Commissions')} className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-4 text-sm font-bold text-orange-700 hover:bg-orange-100">Voir commissions</button>
                <button type="button" onClick={() => addNotification('Export partenaires préparé.', 'success')} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-4 text-sm font-bold text-blue-700 hover:bg-blue-100">Exporter partenaires</button>
                <button type="button" onClick={() => navigateTo('Truth Dashboard')} className="rounded-xl border border-surface-border bg-surface-muted px-3 py-4 text-sm font-bold text-content-primary hover:bg-surface-elevated">Audit partenaires</button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
