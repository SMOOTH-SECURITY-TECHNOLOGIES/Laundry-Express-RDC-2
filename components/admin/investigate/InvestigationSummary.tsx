import React from 'react';
import { InvestigationSummary as InvestigationSummaryType } from '../../../lib/admin/investigate-types';
import { Icon } from '../../Icon';
import { ConfidenceScore } from './ConfidenceScore';

interface InvestigationSummaryProps {
  summary: InvestigationSummaryType;
}

const entityTypeConfig: Record<string, { color: string; icon: React.ComponentProps<typeof Icon>['name'] }> = {
  order: { color: 'bg-blue-100 text-blue-600', icon: 'shoppingBag' },
  payment: { color: 'bg-green-100 text-green-600', icon: 'currencyDollar' },
  delivery: { color: 'bg-purple-100 text-purple-600', icon: 'truck' },
  partner: { color: 'bg-orange-100 text-orange-600', icon: 'building' },
  client: { color: 'bg-pink-100 text-pink-600', icon: 'phone' },
  driver: { color: 'bg-indigo-100 text-indigo-600', icon: 'truck' },
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  actif: 'bg-green-100 text-green-700',
  livree: 'bg-green-100 text-green-700',
  livrée: 'bg-green-100 text-green-700',
  capture: 'bg-green-100 text-green-700',
  capturé: 'bg-green-100 text-green-700',
  terminee: 'bg-green-100 text-green-700',
  terminée: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-500',
  error: 'bg-red-100 text-red-700',
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const InvestigationSummary: React.FC<InvestigationSummaryProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
        Investigation Summary
      </h3>

      <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start">
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
            {summary.entities.map((entity) => {
              const config = entityTypeConfig[entity.type] ?? { color: 'bg-gray-100 text-gray-600', icon: 'circle' };
              const statusKey = entity.status.toLocaleLowerCase('fr-FR');
              return (
                <div key={entity.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                  <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${config.color}`}>
                    <Icon name={config.icon} className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 uppercase">
                    {entity.label}
                  </span>
                  <span className="text-xs font-bold font-mono text-gray-900 truncate w-full">
                    {entity.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[statusKey] ?? 'bg-gray-100 text-gray-500'}`}>
                    {entity.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-shrink-0">
          <ConfidenceScore score={summary.confidence} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t md:grid-cols-3 xl:grid-cols-6">
        <div>
          <span className="text-[10px] text-gray-400 uppercase block">Début</span>
          <span className="text-xs font-semibold text-gray-900">{formatDateTime(summary.startDate)}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase block">Fin</span>
          <span className="text-xs font-semibold text-gray-900">{formatDateTime(summary.endDate)}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase block">Durée</span>
          <span className="text-xs font-semibold text-gray-900">{summary.duration}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase block">Source</span>
          <span className="text-xs font-semibold text-gray-900">{summary.sourcePrincipal}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase block">Corridors</span>
          <span className="text-xs font-semibold text-gray-900">{summary.corridorsLies}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase block">Événements</span>
          <span className="text-xs font-semibold text-gray-900">{summary.evenementsTrouves}</span>
        </div>
      </div>
    </div>
  );
};
