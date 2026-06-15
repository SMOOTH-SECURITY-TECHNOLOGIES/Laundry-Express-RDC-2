import { Icon } from '../../Icon';
import type { AdRow } from '../../../lib/admin/ads-types';

const statusStyle: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  paused: 'bg-orange-100 text-orange-700',
  draft: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  archived: 'bg-gray-100 text-gray-500',
};

const statusLabel: Record<string, string> = {
  active: 'Actif', paused: 'Pause', draft: 'Brouillon', completed: 'Terminé', archived: 'Archivé',
};

const channelLabel: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', whatsapp: 'WhatsApp',
  google: 'Google', email: 'Email', sms: 'SMS',
};

export function AdsActiveTable({ ads, onAction }: { ads: AdRow[]; onAction: (id: string, action: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="paper-plane" className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Publicités actives</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase border-b dark:border-slate-700">
              <th className="text-left py-2 px-2">Titre</th>
              <th className="text-left py-2">Campagne</th>
              <th className="text-left py-2">Canal</th>
              <th className="text-left py-2">Zone</th>
              <th className="text-right py-2">Budget</th>
              <th className="text-right py-2">Dépenses</th>
              <th className="text-right py-2">Impressions</th>
              <th className="text-right py-2">Clics</th>
              <th className="text-right py-2">CTR</th>
              <th className="text-right py-2">Conv.</th>
              <th className="text-right py-2">ROI</th>
              <th className="text-left py-2">Statut</th>
              <th className="text-right py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="py-2.5 px-2 font-medium text-gray-900 dark:text-slate-100">{ad.title}</td>
                <td className="py-2.5">{ad.campaign}</td>
                <td className="py-2.5">{channelLabel[ad.channel] || ad.channel}</td>
                <td className="py-2.5">{ad.zone}</td>
                <td className="py-2.5 text-right">{ad.budget.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5 text-right">{ad.spend.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5 text-right">{ad.impressions.toLocaleString('fr-FR')}</td>
                <td className="py-2.5 text-right">{ad.clicks.toLocaleString('fr-FR')}</td>
                <td className="py-2.5 text-right">{ad.ctr}%</td>
                <td className="py-2.5 text-right">{ad.conversions}</td>
                <td className="py-2.5 text-right font-bold text-green-600">{ad.roi}x</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle[ad.status] || statusStyle.draft}`}>
                    {statusLabel[ad.status] || ad.status}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    {[
                      { a: 'view', icon: 'search', title: 'Voir' },
                      { a: 'edit', icon: 'pencil', title: 'Modifier' },
                      { a: 'pause', icon: 'minus', title: 'Pause' },
                      { a: 'duplicate', icon: 'document', title: 'Dupliquer' },
                      { a: 'archive', icon: 'archive-box', title: 'Archiver' },
                    ].map(({ a, icon, title }) => (
                      <button key={a} type="button" onClick={() => onAction(ad.id, a)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700" title={title}>
                        <Icon name={icon as 'search'} className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
