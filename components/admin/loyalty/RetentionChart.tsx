import { Icon } from '../../Icon';
import type { RetentionPoint } from '../../../lib/admin/loyalty-types';

export function RetentionChart({ data }: { data: RetentionPoint[] }) {
  const max = Math.max(...data.flatMap((d) => [d.members, d.nonMembers]), 1);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chartBar" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold">Rétention membres vs non-membres</h3></div>
      <div className="space-y-4">
        {data.map((d) => (
          <div key={d.period}>
            <p className="text-xs font-medium mb-2">{d.period}</p>
            <div className="flex gap-4 items-end h-16">
              <div className="flex-1">
                <div className="h-full flex items-end"><div className="w-full bg-purple-500 rounded-t" style={{ height: `${(d.members / max) * 100}%`, minHeight: 4 }} title={`Membres ${d.members}%`} /></div>
                <p className="text-[10px] text-center mt-1">Membres {d.members}%</p>
              </div>
              <div className="flex-1">
                <div className="h-full flex items-end"><div className="w-full bg-gray-300 dark:bg-slate-600 rounded-t" style={{ height: `${(d.nonMembers / max) * 100}%`, minHeight: 4 }} title={`Non-membres ${d.nonMembers}%`} /></div>
                <p className="text-[10px] text-center mt-1">Non-membres {d.nonMembers}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
