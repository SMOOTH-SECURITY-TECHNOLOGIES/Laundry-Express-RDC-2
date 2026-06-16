import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { logisticsCard } from './logistics-ui';

type ReportId = 'daily' | 'weekly' | 'monthly' | 'custom';

interface LogisticsReportsProps {
  focusAlertTitle?: string | null;
  focusMissionId?: string | null;
  onClearFocus?: () => void;
}

const REPORTS: Array<{
  id: ReportId;
  icon: 'document-text' | 'calendar' | 'chartBar' | 'arrow-down-tray';
  title: string;
  cadence: string;
  description: string;
  metrics: string[];
  tone: string;
}> = [
  {
    id: 'daily',
    icon: 'document-text',
    title: 'Rapport quotidien',
    cadence: 'Chaque soir',
    description: 'Synthèse des missions, retards, revenus, incidents et véhicules indisponibles du jour.',
    metrics: ['Missions', 'Retards', 'Incidents', 'Revenus'],
    tone: 'bg-blue-50 text-brand-blue dark:bg-blue-950/20 dark:text-blue-200',
  },
  {
    id: 'weekly',
    icon: 'calendar',
    title: 'Rapport hebdomadaire',
    cadence: 'Chaque lundi',
    description: 'Lecture des tendances par zone, chauffeur, véhicule et type de mission sur 7 jours.',
    metrics: ['Zones', 'Chauffeurs', 'SLA', 'Maintenance'],
    tone: 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-200',
  },
  {
    id: 'monthly',
    icon: 'chartBar',
    title: 'Rapport mensuel',
    cadence: 'Fin de mois',
    description: 'Vue directionnelle du coût logistique, ponctualité, utilisation flotte et revenus.',
    metrics: ['Coût', 'Utilisation', 'Ponctualité', 'Marge'],
    tone: 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-200',
  },
  {
    id: 'custom',
    icon: 'arrow-down-tray',
    title: 'Export personnalisé',
    cadence: 'À la demande',
    description: 'Extraction ciblée par période, commune, chauffeur, véhicule, statut ou incident.',
    metrics: ['CSV', 'Filtres', 'Audit', 'Finance'],
    tone: 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-200',
  },
];

const KPI_DATA = [
  { label: 'Missions exportées', value: '540', sub: '320 livrées · 150 transit', icon: 'truck' as const },
  { label: 'SLA livraison', value: '96.5%', sub: 'Objectif 95%', icon: 'clock' as const },
  { label: 'Incidents ouverts', value: '15', sub: '5 retards · 4 attente · 3 paiement', icon: 'warning' as const },
  { label: 'Revenu logistique', value: '12 470 $', sub: '+8% vs semaine passée', icon: 'currencyDollar' as const },
];

const GENERATED_REPORTS = [
  { name: 'daily-ops-2026-06-16.csv', owner: 'Ops', status: 'Prêt', rows: 540 },
  { name: 'fleet-maintenance-2026-06.csv', owner: 'Fleet', status: 'Prêt', rows: 28 },
  { name: 'sla-by-zone-week-25.csv', owner: 'Dispatch', status: 'À revoir', rows: 76 },
];

const INCIDENTS = [
  { type: 'Retard', volume: 5, owner: 'Dispatch', action: 'Réassigner ou prioriser' },
  { type: 'Paiement', volume: 3, owner: 'Finance', action: 'Vérifier transaction' },
  { type: 'Maintenance', volume: 3, owner: 'Fleet', action: 'Bloquer assignation' },
  { type: 'Inactivité chauffeur', volume: 3, owner: 'Drivers', action: 'Contacter chauffeur' },
];

const ZONE_PERFORMANCE = [
  { zone: 'Gombe', missions: 148, onTime: '97.8%', revenue: '4 250 $' },
  { zone: 'Lingwala', missions: 112, onTime: '94.1%', revenue: '2 980 $' },
  { zone: 'Limete', missions: 88, onTime: '91.4%', revenue: '2 310 $' },
  { zone: 'Barumbu', missions: 74, onTime: '95.9%', revenue: '1 890 $' },
];

const buildCsv = (reportTitle: string) =>
  [
    'rapport,kpi,valeur',
    `${reportTitle},missions_exportees,540`,
    `${reportTitle},sla_livraison,96.5%`,
    `${reportTitle},incidents_ouverts,15`,
    `${reportTitle},revenu_logistique,12470`,
  ].join('\n');

export const LogisticsReports: React.FC<LogisticsReportsProps> = ({ focusAlertTitle, focusMissionId, onClearFocus }) => {
  const [selectedReportId, setSelectedReportId] = useState<ReportId>('daily');
  const [generatedReport, setGeneratedReport] = useState<string>('Rapport quotidien');
  const [lastAction, setLastAction] = useState<string>('Aucun export lancé');

  const selectedReport = useMemo(
    () => REPORTS.find((report) => report.id === selectedReportId) ?? REPORTS[0],
    [selectedReportId]
  );

  const handleGenerate = (reportId: ReportId) => {
    const report = REPORTS.find((item) => item.id === reportId) ?? REPORTS[0];
    setSelectedReportId(report.id);
    setGeneratedReport(report.title);
    setLastAction(`Rapport généré: ${report.title}`);
  };

  const handleCsvExport = () => {
    const filename = `${selectedReport.id}-logistics-report-2026-06-16.csv`;
    const content = buildCsv(selectedReport.title);
    setLastAction(`Export CSV prêt: ${filename}`);

    if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-content-primary">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-content-muted">
          Exports opérationnels, SLA, incidents, revenus et utilisation flotte.
        </p>
      </div>

      {focusAlertTitle && (
        <div className="rounded-2xl border border-purple-400/60 bg-purple-500/10 p-4 text-sm text-content-primary">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-extrabold">Rapport ciblé depuis l’alerte: {focusAlertTitle}</p>
              <p className="mt-1 text-content-muted">
                {focusMissionId
                  ? `Contrôler le paiement lié à ${focusMissionId} avant de générer un rapport global.`
                  : 'Contrôler cette alerte avant de générer un rapport global.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('logisticsFocusReportAlert');
                sessionStorage.removeItem('logisticsFocusMissionId');
                onClearFocus?.();
              }}
              className="self-start rounded-xl border border-surface-border-subtle px-3 py-2 text-xs font-bold text-content-primary hover:bg-surface-muted sm:self-center"
            >
              Voir tous les rapports
            </button>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_DATA.map((kpi) => (
          <article key={kpi.label} className={`${logisticsCard} p-5`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-content-muted">{kpi.label}</p>
                <p className="mt-2 text-2xl font-black text-content-primary">{kpi.value}</p>
                <p className="mt-1 text-xs text-content-muted">{kpi.sub}</p>
              </div>
              <span className="rounded-xl bg-brand-blue/10 p-2 text-brand-blue">
                <Icon name={kpi.icon} className="h-5 w-5" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={`${logisticsCard} p-5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-content-primary">Générateur de rapports</h2>
              <p className="text-sm text-content-muted">Dernière action: {lastAction}</p>
            </div>
            <button
              type="button"
              onClick={handleCsvExport}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-700"
            >
              <Icon name="arrow-down-tray" className="h-4 w-4" />
              Exporter CSV
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {REPORTS.map((report) => (
              <article
                key={report.id}
                className={`rounded-2xl border p-4 transition ${
                  selectedReportId === report.id
                    ? 'border-brand-blue bg-brand-blue/5'
                    : 'border-surface-border-subtle bg-surface-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${report.tone}`}>
                    <Icon name={report.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-content-primary">{report.title}</h3>
                      <span className="rounded-full bg-surface-card px-2 py-0.5 text-[11px] font-bold text-content-muted">
                        {report.cadence}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-content-muted">{report.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {report.metrics.map((metric) => (
                        <span key={metric} className="rounded-full bg-surface-card px-2 py-1 text-[11px] font-bold text-content-muted">
                          {metric}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerate(report.id)}
                      className="mt-4 rounded-lg bg-brand-blue px-3 py-2 text-xs font-black text-white hover:bg-brand-blue-700"
                    >
                      Générer {report.title.toLowerCase()}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={`${logisticsCard} p-5`}>
          <div className="flex items-center gap-2">
            <Icon name="document-text" className="h-5 w-5 text-brand-blue" />
            <h2 className="text-lg font-black text-content-primary">Rapport actif</h2>
          </div>
          <div className="mt-4 rounded-2xl bg-surface-muted p-4">
            <p className="text-xs font-bold uppercase text-content-muted">Rapport généré</p>
            <p className="mt-2 text-2xl font-black text-content-primary">{generatedReport}</p>
            <p className="mt-2 text-sm text-content-muted">{selectedReport.description}</p>
          </div>
          <div className="mt-4 space-y-3">
            {GENERATED_REPORTS.map((report) => (
              <div key={report.name} className="flex items-center justify-between gap-3 rounded-xl border border-surface-border-subtle p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-bold text-content-primary">{report.name}</p>
                  <p className="text-xs text-content-muted">{report.owner} · {report.rows} lignes</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-black ${
                  report.status === 'Prêt' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className={`${logisticsCard} overflow-hidden`}>
          <div className="border-b border-surface-border-subtle p-5">
            <h2 className="text-lg font-black text-content-primary">Incidents à reporter</h2>
            <p className="text-sm text-content-muted">Catégorisation prête pour revue quotidienne.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[620px] w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase text-content-muted">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Volume</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border-subtle">
                {INCIDENTS.map((incident) => (
                  <tr key={incident.type}>
                    <td className="px-5 py-4 font-black text-content-primary">{incident.type}</td>
                    <td className="px-5 py-4 text-content-muted">{incident.volume}</td>
                    <td className="px-5 py-4 text-content-muted">{incident.owner}</td>
                    <td className="px-5 py-4 text-content-muted">{incident.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${logisticsCard} overflow-hidden`}>
          <div className="border-b border-surface-border-subtle p-5">
            <h2 className="text-lg font-black text-content-primary">Performance par zone</h2>
            <p className="text-sm text-content-muted">Base analytique pour dispatch, tracking et SLA.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[620px] w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase text-content-muted">
                <tr>
                  <th className="px-5 py-3">Zone</th>
                  <th className="px-5 py-3">Missions</th>
                  <th className="px-5 py-3">On-time</th>
                  <th className="px-5 py-3">Revenu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border-subtle">
                {ZONE_PERFORMANCE.map((zone) => (
                  <tr key={zone.zone}>
                    <td className="px-5 py-4 font-black text-content-primary">{zone.zone}</td>
                    <td className="px-5 py-4 text-content-muted">{zone.missions}</td>
                    <td className="px-5 py-4 text-content-muted">{zone.onTime}</td>
                    <td className="px-5 py-4 text-content-muted">{zone.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LogisticsReports;
