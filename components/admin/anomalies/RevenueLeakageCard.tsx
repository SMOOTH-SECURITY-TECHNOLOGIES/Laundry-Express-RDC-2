import { RevenueLeakageItem } from '../../../lib/admin/anomalies-types';
import { formatImpactAmount } from '../../../lib/admin/anomalies-formatters';

interface RevenueLeakageCardProps {
  items: RevenueLeakageItem[];
  total: number;
}

export default function RevenueLeakageCard({ items, total }: RevenueLeakageCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-900 mb-4">
        Revenue Leakage
      </h3>

      <div className="space-y-2.5">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 truncate mr-2">{item.label}</span>
            <span className="font-medium text-gray-900 whitespace-nowrap">
              {formatImpactAmount(item.amount)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 my-4" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Total potentiel
        </span>
        <span className="text-lg font-bold text-red-600">
          {formatImpactAmount(total)}
        </span>
      </div>

      <a
        href="#"
        className="block mt-4 text-center text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
      >
        Voir détails du leakage →
      </a>
    </div>
  );
}
