import type { DisputeFinancialImpact as DisputeFinancialImpactType } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface DisputeFinancialImpactProps {
  impact: DisputeFinancialImpactType;
}

interface KpiItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  subtext: string;
  subtextColor: string;
}

export function DisputeFinancialImpact({ impact }: DisputeFinancialImpactProps) {
  const kpis: KpiItem[] = [
    {
      label: 'Montant demandé',
      value: `${impact.requested.toLocaleString('fr-FR')} $`,
      icon: <Icon name="currencyDollar" className="w-5 h-5" />,
      iconBg: 'bg-blue-100 text-blue-600',
      subtext: 'Total des demandes',
      subtextColor: 'text-gray-500',
    },
    {
      label: 'Montant remboursé',
      value: `${impact.refunded.toLocaleString('fr-FR')} $`,
      icon: <Icon name="wallet" className="w-5 h-5" />,
      iconBg: 'bg-green-100 text-green-600',
      subtext: 'Remboursé effectivement',
      subtextColor: 'text-green-600',
    },
    {
      label: 'Économies rejetées',
      value: `${impact.saved.toLocaleString('fr-FR')} $`,
      icon: <Icon name="shield-check" className="w-5 h-5" />,
      iconBg: 'bg-emerald-100 text-emerald-600',
      subtext: 'Montants non remboursés',
      subtextColor: 'text-emerald-600',
    },
    {
      label: 'Coût net',
      value: `${impact.netCostPercent}%`,
      icon: <Icon name="chartBar" className="w-5 h-5" />,
      iconBg: 'bg-amber-100 text-amber-600',
      subtext: 'du chiffre d\'affaires',
      subtextColor: 'text-amber-600',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Impact financier
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {kpi.label}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${kpi.iconBg}`}>
                {kpi.icon}
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900">{kpi.value}</span>
            <span className={`text-xs ${kpi.subtextColor}`}>{kpi.subtext}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
