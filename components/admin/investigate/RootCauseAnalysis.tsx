import { RootCauseAnalysis as RootCauseType } from '../../../lib/admin/investigate-types';

interface RootCauseAnalysisProps {
  analysis: RootCauseType;
}

export default function RootCauseAnalysis({ analysis }: RootCauseAnalysisProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4">
        ROOT CAUSE ANALYSIS (IA)
      </h3>

      {/* Main cause */}
      <div className="border-2 border-green-400 rounded-xl p-4 mb-5">
        <p className="text-xs text-green-700 font-medium mb-1">Cause principale probable</p>
        <p className="text-3xl font-bold text-green-600 mb-2">
          {analysis.mainProbability}%
        </p>
        <p className="text-sm text-gray-700 mb-3">{analysis.description}</p>
        <div className="bg-green-50 rounded-lg px-3 py-2">
          <p className="text-sm font-semibold text-green-800">
            Cause probable: {analysis.mainCause}
          </p>
        </div>
      </div>

      {/* Alternative causes */}
      <div className="space-y-3">
        {analysis.alternatives.map((alt, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">{alt.cause}</span>
              <span className="text-sm font-semibold text-gray-900">{alt.probability}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${alt.probability}%`, backgroundColor: alt.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
