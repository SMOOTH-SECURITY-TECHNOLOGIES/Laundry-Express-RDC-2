import { Icon } from '../../Icon';
import { USERS_WRITE_ENABLED } from '../../../lib/admin/users-api';
import type { UserDetail, UserSecurityDetail } from '../../../lib/admin/users-types';

interface Props {
  user: UserDetail | null;
  security: UserSecurityDetail | null;
  loading?: boolean;
  onClose: () => void;
  onSuspend?: () => void;
  onReactivate?: () => void;
}

export function UserSecurityDrawer({ user, security, loading, onClose, onSuspend, onReactivate }: Props) {
  if (!user && !loading) return null;
  const readOnly = !USERS_WRITE_ENABLED;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-xl overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-32 bg-gray-100 rounded-xl" />
          </div>
        ) : user && security && (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold">Sécurité — {user.name}</h2>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
              <Stat label="2FA" value={security.twoFaEnabled ? 'Activé' : 'Désactivé'} />
              <Stat label="Sessions actives" value={String(security.activeSessions)} />
              <Stat label="Connexions suspectes" value={String(security.suspiciousLogins)} />
            </div>
            <h3 className="text-sm font-semibold mb-3">Dernières connexions</h3>
            <div className="space-y-2 mb-6">
              {security.recentLogins.map((l, i) => (
                <div key={`${l.ip}-${i}`} className="flex justify-between text-xs p-2 rounded-lg bg-gray-50">
                  <span className="font-mono">{l.ip}</span>
                  <span className="text-gray-400">{l.date ? new Date(l.date).toLocaleString('fr-FR') : '—'}</span>
                </div>
              ))}
              {security.recentLogins.length === 0 && <p className="text-xs text-gray-400">Aucune connexion enregistrée.</p>}
            </div>
            {readOnly && (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl mb-4">
                Les actions sensibles sont désactivées jusqu&apos;à validation backend.
              </p>
            )}
            <div className="space-y-2">
              <ActionBtn label="Suspendre le compte" danger disabled={readOnly} onClick={onSuspend} />
              <ActionBtn label="Réactiver le compte" disabled={readOnly} onClick={onReactivate} />
              <ActionBtn label="Réinitialiser mot de passe" disabled={readOnly} />
              <ActionBtn label="Déconnecter toutes sessions" disabled={readOnly} />
            </div>
          </>
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

function ActionBtn({ label, danger, disabled, onClick }: { label: string; danger?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full py-2.5 rounded-xl text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed ${danger ? 'border-red-200 text-red-700 hover:bg-red-50' : 'hover:bg-gray-50'}`}
    >
      {label}
    </button>
  );
}
