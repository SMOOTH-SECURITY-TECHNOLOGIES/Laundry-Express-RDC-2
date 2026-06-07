import React from 'react';

interface SkeletonLoaderProps {
  type: 'card' | 'list-item';
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, className = '' }) => {
  if (type === 'card') {
    return (
      <div className={`bg-white rounded-xl shadow-card w-full animate-pulse ${className}`}>
        <div className="bg-slate-200 h-48 rounded-t-xl"></div>
        <div className="p-4 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          <div className="pt-3 border-t border-slate-100 mt-3">
             <div className="h-5 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'list-item') {
    return (
      <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-card w-full animate-pulse flex items-center justify-between ${className}`}>
          <div className="flex-grow space-y-3">
            <div className="h-5 bg-slate-200 rounded w-1/2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
          <div className="w-1/4 space-y-2">
            <div className="h-6 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4 ml-auto"></div>
          </div>
      </div>
    )
  }

  return null;
};
