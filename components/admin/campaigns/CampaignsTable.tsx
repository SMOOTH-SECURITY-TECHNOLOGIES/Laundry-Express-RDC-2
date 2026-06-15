import { Icon } from '../../Icon';
import { CAMPAIGNS_WRITE_ENABLED } from '../../../lib/admin/campaigns-api';
import type { Campaign } from '../../../lib/admin/campaigns-types';

const statusStyle: Record<string, string> = {
  active: 'bg-green-100 text-green-700', paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-700', scheduled: 'bg-blue-100 text-blue-700', draft: 'bg-slate-100 text-slate-600',
};
const statusLabel: Record<string, string> = { active: 'Actif', paused: 'Pause', completed: 'Terminé', scheduled: 'Programmé', draft: 'Brouillon' };
const channelLabel: Record<string, string> = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email', push: 'Push' };

interface Props {
  campaigns: Campaign[];
  search?: string;
  statusFilter?: string;
  channelFilter?: string;
  onEdit: (c: Campaign) => void;
  onPause: (c: Campaign) => void;
  onDuplicate: (c: Campaign) => void;
  onDelete: (c: Campaign) => void;
  onAnalytics: (c: Campaign) => void;
}

export function CampaignsTable({ campaigns, search = '', statusFilter = 'all', channelFilter = 'all', onEdit, onPause, onDuplicate, onDelete, onAnalytics }: Props) {
  const q = search.toLowerCase();
  const rows = campaigns.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.audience || '').toLowerCase().includes(q) || c.channel.includes(q);
  });
  const tip = 'Module à connecter au backend avant activation des actions sensibles.';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="list" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold">Campagnes actives</h3></div>
      {rows.length === 0 ? <p className="text-xs text-gray-500">Aucune campagne pour ces filtres.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-2">Nom</th><th className="pb-2 pr-2">Canal</th><th className="pb-2 pr-2">Audience</th><th className="pb-2 pr-2">Statut</th>
              <th className="pb-2 pr-2">Messages</th><th className="pb-2 pr-2">Ouvertures</th><th className="pb-2 pr-2">Clics</th><th className="pb-2 pr-2">Conv.</th><th className="pb-2 pr-2">ROI</th><th className="pb-2 pr-2">Revenus</th><th className="pb-2">Actions</th>
            </tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 pr-2 font-medium">{c.name}</td>
                  <td className="py-2 pr-2">{channelLabel[c.channel] || c.channel}</td>
                  <td className="py-2 pr-2">{c.audience || '—'}</td>
                  <td className="py-2 pr-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle[c.status] || statusStyle.draft}`}>{statusLabel[c.status] || c.status}</span></td>
                  <td className="py-2 pr-2">{c.messagesSent.toLocaleString('fr-FR')}</td>
                  <td className="py-2 pr-2">{c.opens.toLocaleString('fr-FR')} ({c.openRate}%)</td>
                  <td className="py-2 pr-2">{c.clicks.toLocaleString('fr-FR')} ({c.clickRate}%)</td>
                  <td className="py-2 pr-2">{c.conversions}</td>
                  <td className="py-2 pr-2 font-bold text-green-600">{c.roi}x</td>
                  <td className="py-2 pr-2">{c.revenue.toLocaleString('fr-FR')} $</td>
                  <td className="py-2">
                    <div className="flex gap-1 flex-wrap">
                      <ActionBtn label="Edit" onClick={() => onEdit(c)} disabled={!CAMPAIGNS_WRITE_ENABLED} tip={tip} />
                      <ActionBtn label="Pause" onClick={() => onPause(c)} disabled={!CAMPAIGNS_WRITE_ENABLED} tip={tip} />
                      <ActionBtn label="Dup." onClick={() => onDuplicate(c)} disabled={!CAMPAIGNS_WRITE_ENABLED} tip={tip} />
                      <ActionBtn label="Del" onClick={() => onDelete(c)} disabled={!CAMPAIGNS_WRITE_ENABLED} tip={tip} />
                      <ActionBtn label="Stats" onClick={() => onAnalytics(c)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick, disabled, tip }: { label: string; onClick: () => void; disabled?: boolean; tip?: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} title={disabled ? tip : undefined} className="px-1.5 py-0.5 border rounded text-[10px] hover:bg-gray-50 disabled:opacity-40">{label}</button>;
}
