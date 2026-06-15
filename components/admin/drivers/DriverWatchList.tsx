import { Icon } from '../../Icon';
import type { DriverWatchItem } from '../../../lib/admin/drivers-types';

export function DriverWatchList({ items }: { items: DriverWatchItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="exclamation-circle" className="w-5 h-5 text-orange-600" />
        <h3 className="text-sm font-semibold text-gray-900">Chauffeurs à surveiller</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${item.severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
            <span className="text-sm font-medium text-gray-800">{item.category}</span>
            <span className={`text-lg font-bold ${item.severity === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
