import { Icon } from '../../Icon';
import type { UserDetail } from '../../../lib/admin/users-types';

interface Props {
  user: UserDetail | null;
  loading?: boolean;
  onClose: () => void;
  onSecurity: () => void;
}

const TABS = ['Profil', 'Connexions', 'Commandes', 'Paiements', 'Fidélité', 'Parrainages', 'Support', 'Sécurité', 'Zones'];

export function UserDetailDrawer({ user, loading, onClose, onSecurity }: Props) {
  if (!user && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-xl overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-24 bg-gray-100 rounded-xl" />
            <div className="h-48 bg-gray-100 rounded-xl" />
          </div>
        ) : user && (
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400">{user.phone}</p>
              </div>
              <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {TABS.map((t) => (
                <span key={t} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-[10px] font-medium">{t}</span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
              <Stat label="Rôle" value={user.role} />
              <Stat label="Statut" value={user.status} />
              <Stat label="Commandes" value={String(user.ordersCount)} />
              <Stat label="Total dépensé" value={`${user.totalSpent.toLocaleString('fr-FR')} $`} />
              <Stat label="Points fidélité" value={`${user.loyaltyPoints.toLocaleString('fr-FR')} pts`} />
              <Stat label="Parrainages" value={String(user.referralsCount)} />
              <Stat label="Email vérifié" value={user.isEmailVerified ? 'Oui' : 'Non'} />
              <Stat label="2FA" value={user.is2faEnabled ? 'Activé' : 'Désactivé'} />
            </div>
            <div className="text-xs text-gray-500 space-y-1 mb-6">
              <p>Inscrit le : {user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : '—'}</p>
              <p>Dernière connexion : {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fr-FR') : '—'}</p>
              {user.referralCode && <p>Code parrainage : <span className="font-mono text-purple-600">{user.referralCode}</span></p>}
            </div>
            <button type="button" onClick={onSecurity} className="w-full py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100">
              <Icon name="shield" className="w-4 h-4 inline mr-1" /> Ouvrir sécurité
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
      <p className="text-gray-500">{label}</p>
      <p className="font-bold mt-1">{value}</p>
    </div>
  );
}
