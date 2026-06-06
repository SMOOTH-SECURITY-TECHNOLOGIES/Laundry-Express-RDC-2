import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { DB } from '../../constants';
import { PartnerApplication, ApplicationStatus, PartnerType } from '../../types';

const PARTNER_TYPE_BADGES: Record<PartnerType, { bg: string; text: string; label: string }> = {
  [PartnerType.PRESSING]: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', label: 'Pressing' },
  [PartnerType.LAVANDIER]: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-200', label: 'Lavandier' },
  [PartnerType.LOGISTICS]: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-800 dark:text-violet-200', label: 'Logistique' },
};

const STATUS_BADGES: Record<ApplicationStatus, { bg: string; text: string; label: string }> = {
  [ApplicationStatus.PENDING]: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', label: 'En attente' },
  [ApplicationStatus.APPROVED]: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', label: 'Approuvée' },
  [ApplicationStatus.REJECTED]: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', label: 'Rejetée' },
};

type FilterTab = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

const extractCommune = (address: string): string => {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim());
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const ApplicationCard: React.FC<{
  application: PartnerApplication;
  onClick: () => void;
}> = ({ application, onClick }) => {
  const typeBadge = PARTNER_TYPE_BADGES[application.partnerType];
  const statusBadge = STATUS_BADGES[application.status];
  const commune = extractCommune(application.address);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-brand-blue/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-lg text-brand-dark dark:text-slate-100 truncate">
            {application.companyName}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {application.contactName}
          </p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${typeBadge.bg} ${typeBadge.text}`}>
          {typeBadge.label}
        </span>
        {commune && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {commune}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Icon name="envelope" className="w-3.5 h-3.5" />
          {application.email}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="device-phone-mobile" className="w-3.5 h-3.5" />
          {application.phone}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="calendar" className="w-3.5 h-3.5" />
          {formatDate(application.submittedAt)}
        </span>
      </div>

      {application.message && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 italic">
          &ldquo;{application.message}&rdquo;
        </p>
      )}
    </button>
  );
};

const ApplicationDetailModal: React.FC<{
  application: PartnerApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isProcessing: boolean;
}> = ({ application, onClose, onApprove, onReject, isProcessing }) => {
  const { t, setCurrentPage } = useAppContext();
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const typeBadge = PARTNER_TYPE_BADGES[application.partnerType];
  const statusBadge = STATUS_BADGES[application.status];
  const commune = extractCommune(application.address);

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-brand-dark dark:text-slate-100">
              {application.companyName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${typeBadge.bg} ${typeBadge.text}`}>
                {typeBadge.label}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon name="xmark" className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {t('partnerApplications.detail.companyInfo', { default: 'Informations de l\'entreprise' })}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="building" className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-200">{application.companyName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="mapPin" className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-200">{application.address}</span>
              </div>
              {commune && (
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="home" className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-200">Commune : {commune}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {t('partnerApplications.detail.contact', { default: 'Contact' })}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="user" className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-200">{application.contactName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="device-phone-mobile" className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-200">{application.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="envelope" className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-200">{application.email}</span>
              </div>
            </div>
          </div>

          {application.message && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                {t('partnerApplications.detail.message', { default: 'Message / Notes' })}
              </h3>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-700 dark:text-slate-200 italic">
                  &ldquo;{application.message}&rdquo;
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {t('partnerApplications.detail.documents', { default: 'Documents' })}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center gap-3">
              <Icon name="document-text" className="w-5 h-5 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                {t('partnerApplications.detail.noDocuments', { default: 'Aucun document téléversé' })}
              </p>
            </div>
          </div>

          {application.status === ApplicationStatus.REJECTED && application.rejectionReason && (
            <div>
              <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide mb-2">
                {t('partnerApplications.detail.rejectionReason', { default: 'Raison du rejet' })}
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {application.rejectionReason}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            {application.status === ApplicationStatus.PENDING && (
              <>
                <button
                  onClick={onApprove}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  <Icon name="check" className="w-4 h-4" />
                  {t('partnerApplications.actions.approve', { default: 'Approuver' })}
                </button>
                <button
                  onClick={() => setShowRejectInput(!showRejectInput)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  <Icon name="xmark" className="w-4 h-4" />
                  {t('partnerApplications.actions.reject', { default: 'Rejeter' })}
                </button>
              </>
            )}

            {application.status === ApplicationStatus.APPROVED && (
              <button
                onClick={() => setCurrentPage({ name: 'partner-detail' })}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold rounded-xl transition-colors"
              >
                <Icon name="arrowRight" className="w-4 h-4" />
                {t('partnerApplications.actions.viewPartner', { default: 'Voir le partenaire' })}
              </button>
            )}

            {application.status === ApplicationStatus.REJECTED && (
              <button
                onClick={onApprove}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                <Icon name="arrow-path" className="w-4 h-4" />
                {t('partnerApplications.actions.reapprove', { default: 'Réapprouver' })}
              </button>
            )}

            <button
              onClick={onClose}
              className="ml-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors"
            >
              {t('buttons.close', { default: 'Fermer' })}
            </button>
          </div>

          {showRejectInput && application.status === ApplicationStatus.PENDING && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
              <label className="text-sm font-medium text-red-700 dark:text-red-300">
                {t('partnerApplications.rejectReasonLabel', { default: 'Raison du rejet (requis)' })}
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder={t('partnerApplications.rejectReasonPlaceholder', { default: 'Indiquez la raison du rejet...' })}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || isProcessing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {t('partnerApplications.actions.confirmReject', { default: 'Confirmer le rejet' })}
                </button>
                <button
                  onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors"
                >
                  {t('buttons.cancel', { default: 'Annuler' })}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PartnerApplicationsPage: React.FC = () => {
  const { t, addNotification, approvePartnerApplication, rejectPartnerApplication } = useAppContext();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshApplications = useCallback(() => {
    setApplications(DB.get('partnerApplications'));
  }, []);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === ApplicationStatus.PENDING).length;
    const approved = applications.filter(a => a.status === ApplicationStatus.APPROVED).length;
    const rejected = applications.filter(a => a.status === ApplicationStatus.REJECTED).length;
    return { total, pending, approved, rejected };
  }, [applications]);

  const filteredApps = useMemo(() => {
    if (activeTab === 'all') return applications;
    return applications.filter(a => a.status === activeTab);
  }, [applications, activeTab]);

  const handleApprove = useCallback(async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      await approvePartnerApplication(selectedApp.id);
      DB.updateItem('partnerApplications', selectedApp.id, { status: ApplicationStatus.APPROVED });
      refreshApplications();
      setSelectedApp(null);
      addNotification(t('partnerApplications.notifications.approved', { default: 'Candidature approuvée avec succès.' }), 'success');
    } catch {
      addNotification(t('partnerApplications.notifications.approveError', { default: 'Erreur lors de l\'approbation.' }), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedApp, approvePartnerApplication, refreshApplications, addNotification, t]);

  const handleReject = useCallback(async (reason: string) => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      await rejectPartnerApplication(selectedApp.id, reason);
      refreshApplications();
      setSelectedApp(null);
      addNotification(t('partnerApplications.notifications.rejected', { default: 'Candidature rejetée.' }), 'info');
    } catch {
      addNotification(t('partnerApplications.notifications.rejectError', { default: 'Erreur lors du rejet.' }), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedApp, rejectPartnerApplication, refreshApplications, addNotification, t]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: t('partnerApplications.tabs.all', { default: 'Toutes' }), count: stats.total },
    { key: 'PENDING', label: t('partnerApplications.tabs.pending', { default: 'En attente' }), count: stats.pending },
    { key: 'APPROVED', label: t('partnerApplications.tabs.approved', { default: 'Approuvées' }), count: stats.approved },
    { key: 'REJECTED', label: t('partnerApplications.tabs.rejected', { default: 'Rejetées' }), count: stats.rejected },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-dark dark:text-slate-100">
          {t('partnerApplications.title', { default: 'Candidatures partenaires' })}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t('partnerApplications.subtitle', { default: 'Gérez les demandes d\'adhésion des partenaires.' })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('partnerApplications.stats.total', { default: 'Total' })}
          </p>
          <p className="text-3xl font-bold mt-2 text-brand-dark dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('partnerApplications.stats.pending', { default: 'En attente' })}
          </p>
          <p className="text-3xl font-bold mt-2 text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('partnerApplications.stats.approved', { default: 'Approuvées' })}
          </p>
          <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">{stats.approved}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('partnerApplications.stats.rejected', { default: 'Rejetées' })}
          </p>
          <p className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">{stats.rejected}</p>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.key
                  ? 'bg-brand-blue/10 text-brand-blue'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map(app => (
            <ApplicationCard
              key={app.id}
              application={app}
              onClick={() => setSelectedApp(app)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700">
          <Icon name="document-text" className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
            {t('partnerApplications.empty', { default: 'Aucune candidature' })}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t('partnerApplications.emptyDescription', { default: 'Aucune candidature ne correspond à ce filtre.' })}
          </p>
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};
