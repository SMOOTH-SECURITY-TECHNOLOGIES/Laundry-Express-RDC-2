import React, { useState, useMemo } from 'react';
import { Icon } from '../../components/Icon';
import type { LogisticsSection } from '../../components/logistics/logistics-types';
import { logisticsCard } from './logistics-ui';

interface Alert {
  id: string;
  type: 'retard' | 'attente' | 'inactif' | 'paiement';
  title: string;
  description: string;
  count: number;
  timestamp: string;
}

const MOCK_ALERTS: Alert[] = [
  { id: 'ALT-001', type: 'retard', title: 'Mission MSN-004 en retard', description: 'Le chauffeur Tshimanga A. est en retard de 15 min sur la mission #MSN-004', count: 1, timestamp: 'Il y a 5 min' },
  { id: 'ALT-002', type: 'attente', title: '3 missions en attente d\'assignation', description: 'Des clients attendent depuis plus de 10 minutes', count: 3, timestamp: 'Il y a 8 min' },
  { id: 'ALT-003', type: 'retard', title: 'Mission MSN-011 en retard', description: 'Le chauffeur Kapenda N. signale un embouteillage sur la route', count: 1, timestamp: 'Il y a 12 min' },
  { id: 'ALT-004', type: 'inactif', title: 'Chauffeur Mbuyi T. inactif', description: 'Aucune activité depuis 2 heures, dernière position: Matete', count: 1, timestamp: 'Il y a 15 min' },
  { id: 'ALT-005', type: 'paiement', title: 'Paiement échoué MSN-007', description: 'Le paiement de Marie C. a échoué - 4 800 $ en attente', count: 1, timestamp: 'Il y a 20 min' },
  { id: 'ALT-006', type: 'retard', title: 'Livraison MSN-014 retardée', description: 'Le chauffeur Mwamba E. signale un problème mécanique', count: 1, timestamp: 'Il y a 25 min' },
  { id: 'ALT-007', type: 'attente', title: 'Zone Gombe surchargée', description: '5 missions en attente dans la zone Gombe', count: 5, timestamp: 'Il y a 30 min' },
  { id: 'ALT-008', type: 'inactif', title: 'Chauffeur Kolomba D. inactif', description: 'Pas de mission assignée depuis 45 minutes', count: 1, timestamp: 'Il y a 35 min' },
  { id: 'ALT-009', type: 'paiement', title: 'Remboursement demandé MSN-018', description: 'Francois G. a demandé un remboursement de 7 900 $', count: 1, timestamp: 'Il y a 40 min' },
  { id: 'ALT-010', type: 'retard', title: 'Retard moyen en hausse', description: 'Le temps moyen de livraison a augmenté de 12% aujourd\'hui', count: 8, timestamp: 'Il y a 45 min' },
  { id: 'ALT-011', type: 'attente', title: 'Mission MSN-019 sans chauffeur', description: 'La mission de Monique V. attend depuis 20 minutes', count: 1, timestamp: 'Il y a 50 min' },
  { id: 'ALT-012', type: 'inactif', title: 'Chauffeur Kalalá C. suspendu', description: 'Activité suspecte détectée - suspendu automatiquement', count: 1, timestamp: 'Il y a 1h' },
  { id: 'ALT-013', type: 'paiement', title: 'Solde bas pour chauffeur Kanda F.', description: 'Le solde du portefeuille est inférieur à 1 000 $', count: 1, timestamp: 'Il y a 1h' },
  { id: 'ALT-014', type: 'retard', title: '3 missions avec retard > 20 min', description: 'Les clients commencent à se plaindre', count: 3, timestamp: 'Il y a 1h15' },
  { id: 'ALT-015', type: 'attente', title: 'File d\'attente Limete bloquée', description: 'Aucun chauffeur disponible dans la zone Limete', count: 2, timestamp: 'Il y a 1h30' },
];

const TYPE_CONFIG: Record<string, { icon: React.ComponentProps<typeof Icon>['name']; color: string; bg: string; label: string }> = {
  retard: { icon: 'clock', color: 'text-red-500', bg: 'bg-red-50', label: 'Retard' },
  attente: { icon: 'exclamation-circle', color: 'text-orange-500', bg: 'bg-orange-50', label: 'En attente' },
  inactif: { icon: 'user', color: 'text-gray-500', bg: 'bg-gray-100', label: 'Inactif' },
  paiement: { icon: 'currencyDollar', color: 'text-purple-500', bg: 'bg-purple-50', label: 'Paiement' },
};

const FILTERS = ['Toutes', 'Retards', 'En attente', 'Inactifs', 'Paiements'] as const;

const FILTER_MAP: Record<string, string | null> = {
  'Toutes': null,
  'Retards': 'retard',
  'En attente': 'attente',
  'Inactifs': 'inactif',
  'Paiements': 'paiement',
};

const ACTION_TARGETS: Record<Alert['type'], { label: string; section: LogisticsSection; feedback: string }> = {
  retard: {
    label: 'Voir',
    section: 'missions',
    feedback: 'Ouverture des missions pour analyser le retard.',
  },
  attente: {
    label: 'Résoudre',
    section: 'missions',
    feedback: 'Ouverture du backlog missions pour assignation.',
  },
  inactif: {
    label: 'Contacter',
    section: 'drivers',
    feedback: 'Ouverture des chauffeurs pour prise de contact.',
  },
  paiement: {
    label: 'Résoudre',
    section: 'reports',
    feedback: 'Ouverture des rapports pour suivi paiement.',
  },
};

interface LogisticsAlertsProps {
  onNavigate: (section: LogisticsSection) => void;
  onActionFeedback?: (message: string) => void;
}

export const LogisticsAlerts: React.FC<LogisticsAlertsProps> = ({ onNavigate, onActionFeedback }) => {
  const [activeFilter, setActiveFilter] = useState<string>('Toutes');

  const filteredAlerts = useMemo(() => {
    const typeFilter = FILTER_MAP[activeFilter];
    if (!typeFilter) return MOCK_ALERTS;
    return MOCK_ALERTS.filter(a => a.type === typeFilter);
  }, [activeFilter]);

  const getFilterCount = (filter: string) => {
    const typeFilter = FILTER_MAP[filter];
    if (!typeFilter) return MOCK_ALERTS.length;
    return MOCK_ALERTS.filter(a => a.type === typeFilter).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">Alertes opérationnelles</h1>
          <p className="text-sm text-gray-500 mt-1">{MOCK_ALERTS.length} alertes actives</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(filter => (
          <button
            type="button"
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-brand-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeFilter === filter ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {getFilterCount(filter)}
            </span>
          </button>
        ))}
      </div>

      {filteredAlerts.length === 0 ? (
        <div className={`${logisticsCard} p-16 text-center`}>
          <Icon name="bell" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Aucune alerte dans cette catégorie</p>
          <p className="text-gray-400 text-xs mt-1">Tout est sous contrôle !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => {
            const config = TYPE_CONFIG[alert.type];
            const action = ACTION_TARGETS[alert.type];
            const actionClass = alert.type === 'retard'
              ? 'bg-brand-blue hover:bg-brand-blue/90'
              : alert.type === 'inactif'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-brand-orange hover:bg-orange-600';
            return (
              <div key={alert.id} className={`${logisticsCard} p-5 transition-shadow hover:shadow-md`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                    <Icon name={config.icon} className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-brand-dark">{alert.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {alert.count > 1 && (
                        <span className="text-xs font-bold text-brand-orange">{alert.count} éléments</span>
                      )}
                      <span className="text-xs text-gray-400">{alert.timestamp}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`#${action.section}`}
                      onClick={() => {
                        onNavigate(action.section);
                        onActionFeedback?.(action.feedback);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold ${actionClass}`}
                    >
                      {action.label}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LogisticsAlerts;
