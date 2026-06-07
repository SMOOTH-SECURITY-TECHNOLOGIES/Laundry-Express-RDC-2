import { Violation } from '../../../lib/admin/investigate-types';

interface DetectedViolationsProps {
  violations: Violation[];
}

const severityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  major: 'border-l-orange-500',
  medium: 'border-l-yellow-400',
  low: 'border-l-gray-400',
};

const severityBadge: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  major: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

const severityLabels: Record<string, string> = {
  critical: 'Critique',
  major: 'Majeur',
  medium: 'Moyen',
  low: 'Faible',
};

const formatDetectedAt = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function DetectedViolations({ violations }: DetectedViolationsProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs font-bold text-gray-500 tracking-wider">
          DETECTED VIOLATIONS
        </h3>
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
          {violations.length}
        </span>
      </div>

      <div className="space-y-3">
        {violations.map((v) => (
          <div
            key={v.id}
            className={`border-l-4 rounded-lg bg-gray-50 p-3 ${severityBorder[v.severity] ?? 'border-l-gray-300'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityBadge[v.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                {severityLabels[v.severity] ?? v.severity}
              </span>
              <span className="text-sm font-bold text-gray-900">{v.title}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{v.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-gray-700">Impact:</span> {v.impact}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-gray-700">Détecté:</span>{' '}
                {formatDetectedAt(v.detectedAt)}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-gray-700">Preuve:</span> {v.proof}
              </span>
            </div>
          </div>
        ))}
      </div>

      {violations.length > 0 && (
        <button type="button" className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          Voir toutes les violations
        </button>
      )}
    </div>
  );
}
