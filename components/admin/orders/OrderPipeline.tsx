import { Icon } from "../../Icon";
import type { PipelineStep } from "../../../lib/admin/orders-types";

interface OrderPipelineProps {
  steps: PipelineStep[];
}

export function OrderPipeline({ steps }: OrderPipelineProps) {
  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border-subtle shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-content-primary">Pipeline des commandes</h3>
        <p className="text-xs text-content-muted">Vue du flux complet des étapes</p>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, idx) => {
          const totalSteps = steps.length;
          const progress = totalSteps > 1 ? ((idx + 1) / totalSteps) * 100 : 0;

          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center min-w-[90px]">
                <div
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${step.color}18` }}
                >
                  <Icon name={step.icon as any} className="w-6 h-6" style={{ color: step.color }} />
                  <span
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.count}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-medium text-content-muted text-center leading-tight">
                  {step.label}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex items-center mx-1 mt-[-16px]">
                  <svg width="24" height="12" viewBox="0 0 24 12" className="flex-shrink-0">
                    <path
                      d="M0 6h18M14 1l5 5-5 5"
                      fill="none"
                      stroke="currentColor"
                      className="text-content-faint"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-surface-border-subtle">
        <div className="flex items-center gap-2">
          {steps.map((step, idx) => {
            const total = steps.reduce((s, st) => s + st.count, 0);
            const pct = total > 0 ? (step.count / total) * 100 : 0;
            return (
              <div
                key={step.label}
                className="h-2 rounded-full"
                style={{ width: `${pct}%`, backgroundColor: step.color }}
                title={`${step.label}: ${step.count}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-content-muted">Créée</span>
          <span className="text-[10px] text-content-muted">Terminée</span>
        </div>
      </div>
    </div>
  );
}
