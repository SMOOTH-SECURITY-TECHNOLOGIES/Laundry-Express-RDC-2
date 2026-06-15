import { CorridorStatus } from '../../../lib/admin/investigate-types';

interface CorridorsImpactedProps {
  corridors: CorridorStatus[];
}

const statusConfig: Record<string, { label: string; badge: string; circle: string }> = {
  healthy: { label: 'Sain', badge: 'bg-green-100 text-green-700', circle: 'bg-green-100 text-green-600' },
  degraded: { label: 'Dégradé', badge: 'bg-orange-100 text-orange-700', circle: 'bg-orange-100 text-orange-600' },
  critical: { label: 'Critique', badge: 'bg-red-100 text-red-700', circle: 'bg-red-100 text-red-600' },
};

export default function CorridorsImpacted({ corridors }: CorridorsImpactedProps) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4">
        CORRIDORS IMPACTÉS
      </h3>

      <div className="flex gap-3">
        {corridors.map((c, idx) => {
          const cfg = statusConfig[c.status] ?? statusConfig.healthy;
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${cfg.circle}`}>
                {c.icon}
              </div>
              <span className="text-xs font-semibold text-gray-800 text-center leading-tight">
                {c.name}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
