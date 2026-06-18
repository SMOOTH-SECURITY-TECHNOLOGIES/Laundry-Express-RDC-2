import React from 'react';

export interface FilterOption {
  key: string;
  label: string;
  count?: number;
}

interface HorizontalFilterProps {
  options: FilterOption[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Afficher les compteurs à côté des labels */
  showCounts?: boolean;
  /** Variante visuelle */
  variant?: 'pills' | 'underline';
  /** Centré ou scroll */
  center?: boolean;
}

export const HorizontalFilter: React.FC<HorizontalFilterProps> = ({
  options,
  activeKey,
  onChange,
  showCounts = true,
  variant = 'pills',
  center = false,
}) => {
  if (variant === 'underline') {
    return (
      <div
        className={`flex ${center ? 'justify-center' : 'overflow-x-auto scrollbar-hide'} gap-1 border-b border-surface-border-subtle`}
        role="tablist"
      >
        {options.map((opt) => {
          const active = activeKey === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.key)}
              className={`relative shrink-0 px-4 py-3 text-sm font-bold transition ${
                active ? 'text-brand-blue' : 'text-content-muted hover:text-content-primary'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {opt.label}
                {showCounts && opt.count != null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                      active ? 'bg-brand-blue/10 text-brand-blue' : 'bg-surface-muted text-content-muted'
                    }`}
                  >
                    {opt.count}
                  </span>
                )}
              </span>
              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand-blue" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`flex ${center ? 'justify-center' : 'overflow-x-auto scrollbar-hide'} gap-2 px-1`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = activeKey === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition ${
              active
                ? 'bg-brand-blue text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30'
                : 'bg-surface-muted text-content-muted hover:bg-surface-border active:bg-surface-border'
            }`}
          >
            {opt.label}
            {showCounts && opt.count != null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                  active ? 'bg-white/20 text-white' : 'bg-surface-border text-content-muted'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default HorizontalFilter;
