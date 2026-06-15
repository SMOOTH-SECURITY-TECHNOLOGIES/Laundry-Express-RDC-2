import { useState } from 'react';
import type { TrackingProvider, ServerSideTracking } from '../../../lib/admin/integrations-types';
import { INTEGRATIONS_WRITE_ENABLED } from '../../../lib/admin/integrations-api';

const PLACEHOLDERS: Record<string, string> = { gtm: 'GTM-XXXXXXX', meta: '123456789012345', ga4: 'G-XXXXXXXX', tiktok: 'CXXXXXXXXXXXX', linkedin: '1234567' };
const healthColors: Record<string, string> = { healthy: 'bg-green-100 text-green-700', warning: 'bg-amber-100 text-amber-700', error: 'bg-red-100 text-red-700' };

export function TrackingCenter({ tracking, serverSide, onSave }: {
  tracking: TrackingProvider[]; serverSide: ServerSideTracking; onSave: (provider: string, value: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tracking.map((t) => (
          <div key={t.provider} className="bg-white rounded-2xl border shadow-sm p-5">
            <div className="flex justify-between mb-3">
              <h4 className="font-semibold">{t.providerLabel}</h4>
              <span className={`px-2 py-0.5 rounded-full text-xs ${healthColors[t.healthStatus] || ''}`}>{t.healthLabel}</span>
            </div>
            <input
              value={drafts[t.provider] ?? t.configValue ?? ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [t.provider]: e.target.value }))}
              placeholder={PLACEHOLDERS[t.provider]}
              className="w-full px-3 py-2 border rounded-xl text-sm font-mono mb-2"
            />
            <button type="button" disabled={!INTEGRATIONS_WRITE_ENABLED} onClick={() => onSave(t.provider, drafts[t.provider] ?? t.configValue ?? '')} className="text-xs text-blue-600 disabled:opacity-50">Enregistrer</button>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold mb-4">Server-side Tracking</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold">{serverSide.eventsRelayed24h.toLocaleString('fr-FR')}</p><p className="text-xs text-gray-500">Événements relayés (24h)</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold text-green-600">{serverSide.successRate}%</p><p className="text-xs text-gray-500">Succès</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold text-red-600">{serverSide.failedEvents}</p><p className="text-xs text-gray-500">Échecs</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold">{serverSide.queueSize}</p><p className="text-xs text-gray-500">Queue size</p></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold mb-3">Runtime Status</h3>
        <div className="flex flex-wrap gap-2">{tracking.filter((t) => ['gtm', 'meta', 'ga4', 'tiktok'].includes(t.provider)).map((t) => (
          <span key={t.provider} className={`px-3 py-1 rounded-full text-xs ${healthColors[t.healthStatus] || ''}`}>{t.providerLabel}: {t.healthLabel}</span>
        ))}</div>
      </div>
    </div>
  );
}
