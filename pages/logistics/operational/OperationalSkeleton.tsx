import React from 'react';

export const OperationalSkeleton: React.FC = () => (
  <div className="space-y-5">
    <div className="h-28 animate-pulse rounded-[24px] bg-surface-muted" />
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-[18px] bg-surface-muted" />
      ))}
    </div>
    <div className="h-[520px] animate-pulse rounded-[28px] bg-slate-900/20" />
  </div>
);
