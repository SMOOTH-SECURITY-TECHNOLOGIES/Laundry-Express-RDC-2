import type { ClaimWorkflowColumn } from '../../../lib/admin/claims-types';

export function ClaimWorkflowBoard({ workflow }: { workflow: ClaimWorkflowColumn[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 overflow-x-auto">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Claims Workflow</h3>
      <div className="flex gap-3 min-w-max">
        {workflow.map((col) => (
          <div key={col.stage} className="w-52 bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase">{col.stageLabel}</span>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full border">{col.claims.length}</span>
            </div>
            <div className="space-y-2">
              {col.claims.map((c) => (
                <div key={c.id} className="bg-white border rounded-lg p-2 text-xs shadow-sm">
                  <p className="font-mono text-[10px] text-gray-400">#{c.claimNumber}</p>
                  <p className="font-medium truncate">{c.title}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-gray-100">{c.priorityLabel}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
