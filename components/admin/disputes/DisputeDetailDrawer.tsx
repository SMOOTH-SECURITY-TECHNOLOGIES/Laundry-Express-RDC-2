import React from 'react';
import type { DisputeRequest } from '../../../lib/admin/disputes-types';
import { getStatusLabel, getTypeLabel, getStatusBadgeColor, getTypeBadgeColor, formatCurrency, formatDateTime } from '../../../lib/admin/disputes-formatters';
import { Icon } from '../../Icon';

interface DisputeDetailDrawerProps {
  isOpen: boolean;
  dispute: DisputeRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  readOnly?: boolean;
}

function TruthScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${(score / 100) * 94.25} 94.25`}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
          {score}
        </span>
      </div>
      <div>
        <span className={`text-sm font-bold ${color}`}>{score}/100</span>
        <p className="text-xs text-gray-500">Truth Score</p>
      </div>
    </div>
  );
}

export function DisputeDetailDrawer({ isOpen, dispute, onClose, onApprove, onReject, readOnly }: DisputeDetailDrawerProps) {
  if (!isOpen || !dispute) return null;

  const timeline = dispute.timeline ?? [];
  const notes = dispute.notes ?? [];
  const anomalies = dispute.anomalies ?? [];

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-gray-900">{dispute.id}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(dispute.status)}`}>
              {getStatusLabel(dispute.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Icon name="xmark" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dispute Info */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informations du litige</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Type</span>
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeBadgeColor(dispute.type)}`}>
                  {getTypeLabel(dispute.type)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Montant</span>
                <span className="ml-2 text-sm font-bold text-gray-900">{formatCurrency(dispute.amount, dispute.currency)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Sévérité</span>
                <span className="ml-2 text-sm text-gray-700">{dispute.severity}</span>
              </div>
              {dispute.assignedTo && (
                <div>
                  <span className="text-xs text-gray-500">Assigné à</span>
                  <span className="ml-2 text-sm text-gray-700">{dispute.assignedTo}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500">Date de demande</span>
                <span className="ml-2 text-sm text-gray-700">{formatDateTime(dispute.requestedAt)}</span>
              </div>
              {dispute.resolvedAt && (
                <div>
                  <span className="text-xs text-gray-500">Date résolution</span>
                  <span className="ml-2 text-sm text-gray-700">{formatDateTime(dispute.resolvedAt)}</span>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-xs text-gray-500">Raison</span>
                <p className="mt-1 text-sm text-gray-700">{dispute.reason}</p>
              </div>
            </div>
          </section>

          {/* Order Info */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Commande</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">ID Commande</span>
                <span className="ml-2 font-mono text-sm text-gray-900">{dispute.orderId}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Pièces jointes</span>
                <span className="ml-2 text-sm text-gray-700">{dispute.evidenceCount} fichier(s)</span>
              </div>
            </div>
          </section>

          {/* Client */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Client</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Icon name="user" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{dispute.clientName}</p>
                {dispute.clientPhone && (
                  <p className="text-xs text-gray-500">{dispute.clientPhone}</p>
                )}
              </div>
            </div>
          </section>

          {/* Partner */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Partenaire</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <Icon name="building" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{dispute.partnerName}</p>
                {dispute.driverName && (
                  <p className="text-xs text-gray-500">Chauffeur: {dispute.driverName}</p>
                )}
              </div>
            </div>
          </section>

          {/* Truth Score */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Truth Score</h3>
            <TruthScoreGauge score={dispute.truthScore} />
          </section>

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Anomalies détectées</h3>
              <div className="flex flex-wrap gap-2">
                {anomalies.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                    <Icon name="warning" className="w-3 h-3" />
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Chronologie</h3>
              <div className="space-y-3">
                {timeline.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                      <div className="w-px flex-1 bg-gray-200" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900">{event.label}</p>
                      <p className="text-xs text-gray-500">{event.detail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(event.timestamp)} — {event.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {notes.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{note.author}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(note.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{note.content}</p>
                    <span className="text-xs text-gray-400 italic">{note.role}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {!readOnly && dispute.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => onApprove(dispute.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                  title="Approuver remboursement"
                >
                  <Icon name="check" className="w-4 h-4" /> Approuver remboursement
                </button>
                <button
                  type="button"
                  onClick={() => onReject(dispute.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  <Icon name="xmark" className="w-4 h-4" /> Rejeter
                </button>
              </>
            )}
            {readOnly && (
              <span
                className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg"
                title="Les actions de résolution seront activées lorsque les contrats API seront alignés."
              >
                Mode lecture seule
              </span>
            )}
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Icon name="paper-plane" className="w-4 h-4" /> Demander preuves
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Icon name="user" className="w-4 h-4" /> Assigner
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Icon name="shield-check" className="w-4 h-4" /> Ouvrir Truth
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Icon name="shield-check" className="w-4 h-4" /> Investiguer
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
