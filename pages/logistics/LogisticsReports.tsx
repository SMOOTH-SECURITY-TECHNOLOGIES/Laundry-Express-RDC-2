import React from 'react';
import { Icon } from '../../components/Icon';
import { logisticsCard } from './logistics-ui';

const REPORTS = [
  {
    id: 'daily',
    icon: 'document-text' as const,
    title: 'Rapport quotidien',
    description: 'Résumé des missions, revenus et performance du jour. Inclut les stats par chauffeur et les anomalies détectées.',
    tone: 'bg-blue-50 text-brand-blue',
  },
  {
    id: 'weekly',
    icon: 'calendar' as const,
    title: 'Rapport hebdomadaire',
    description: 'Analyse complète de la semaine avec tendances, comparaisons et recommandations d\'optimisation.',
    tone: 'bg-green-50 text-green-600',
  },
  {
    id: 'monthly',
    icon: 'chartBar' as const,
    title: 'Rapport mensuel',
    description: 'Vue d\'ensemble mensuelle avec KPIs, évolution des revenus et performance des chauffeurs.',
    tone: 'bg-orange-50 text-orange-600',
  },
  {
    id: 'custom',
    icon: 'arrow-down-tray' as const,
    title: 'Export personnalisé',
    description: 'Créez un rapport sur mesure en sélectionnant la période, les filtres et les métriques souhaitées.',
    tone: 'bg-purple-50 text-purple-600',
  },
];

export const LogisticsReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-content-primary">Rapports</h1>
        <p className="text-sm text-content-muted mt-1">Générez et téléchargez vos rapports d'opération</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORTS.map(report => (
          <div key={report.id} className={`${logisticsCard} p-6 transition-shadow hover:shadow-md`}>
            <div className="flex items-start gap-4">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${report.tone}`}>
                <Icon name={report.icon} className="h-7 w-7" />
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-content-primary mb-1">{report.title}</h3>
                <p className="text-sm text-content-muted mb-4">{report.description}</p>
                <button className="px-5 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 flex items-center gap-2">
                  <Icon name="arrow-down-tray" className="w-4 h-4" />
                  Générer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogisticsReports;
