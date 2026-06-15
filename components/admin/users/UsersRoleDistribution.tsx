import { Icon } from '../../Icon';
import type { RoleDistribution } from '../../../lib/admin/users-types';

export function UsersRoleDistribution({ data, total }: { data: RoleDistribution[]; total: number }) {
  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold">Répartition par rôle</h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.map((d) => {
              const dash = (d.percent / 100) * circ;
              const el = <circle key={d.role} cx="50" cy="50" r={r} fill="none" stroke={d.color} strokeWidth="18" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />;
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold">{total}</span>
            <span className="text-[10px] text-gray-500">Total</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-xs w-full">
          {data.map((d) => (
            <div key={d.role} className="flex justify-between">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.role}</span>
              <span className="text-gray-500">{d.count} ({d.percent}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
