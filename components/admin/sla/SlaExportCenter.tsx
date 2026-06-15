import React from 'react';
import { Icon } from '../../Icon';

const FORMATS = [
  { id: 'pdf' as const, label: 'PDF' },
  { id: 'excel' as const, label: 'Excel' },
  { id: 'csv' as const, label: 'CSV' },
  { id: 'json' as const, label: 'JSON' },
];

interface SlaExportCenterProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf' | 'json') => void;
}

export function SlaExportCenter({ open, onClose, onExport }: SlaExportCenterProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Export Center</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Filtres : Zone · Partenaire · Chauffeur · Date · Service</p>
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((f) => (
            <button key={f.id} type="button" onClick={() => { onExport(f.id); onClose(); }} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">
              <Icon name="arrow-down-tray" className="w-4 h-4" /> {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
