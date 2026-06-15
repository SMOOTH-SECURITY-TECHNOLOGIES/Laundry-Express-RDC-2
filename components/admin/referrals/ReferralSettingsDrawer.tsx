import type { ReferralSettings } from '../../../lib/admin/referrals-types';
import { ReferralSettingsCard } from './ReferralSettingsCard';

interface Props {
  open: boolean;
  settings: ReferralSettings | null;
  onChange: (s: ReferralSettings) => void;
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
}

export function ReferralSettingsDrawer({ open, settings, onChange, onSave, onClose, saving }: Props) {
  if (!open || !settings) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-lg bg-[#F8FAFC] dark:bg-slate-950 h-full shadow-xl overflow-y-auto p-6">
        <ReferralSettingsCard
          settings={settings}
          onChange={onChange}
          onSave={onSave}
          onHistory={onClose}
          saving={saving}
        />
      </div>
    </div>
  );
}
