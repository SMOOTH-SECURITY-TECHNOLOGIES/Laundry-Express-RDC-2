import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { Evidence } from '../../../lib/admin/investigate-types';

type EvidenceCategory = 'photo' | 'payment' | 'log' | 'document';

interface EvidenceCenterProps {
  evidence: Evidence[];
}

const tabConfig: { key: EvidenceCategory; label: string; icon: string }[] = [
  { key: 'photo', label: 'Photos', icon: 'photo' },
  { key: 'payment', label: 'Paiements', icon: 'credit-card' },
  { key: 'log', label: 'Logs', icon: 'document-text' },
  { key: 'document', label: 'Documents', icon: 'document' },
];

const categoryIcons: Record<EvidenceCategory, React.ComponentProps<typeof Icon>['name']> = {
  photo: 'photo',
  payment: 'currencyDollar',
  log: 'document-text',
  document: 'document',
};

const categoryColors: Record<EvidenceCategory, string> = {
  photo: 'bg-blue-100 text-blue-600',
  payment: 'bg-amber-100 text-amber-600',
  log: 'bg-green-100 text-green-600',
  document: 'bg-purple-100 text-purple-600',
};

const mockEvidence: Evidence[] = [
  { id: 'p1', category: 'photo', title: 'Photo de collecte', description: 'Colis photographié par le chauffeur Jean Mukendi au point de ramassage.', timestamp: '15 Mai 2026, 09:05' },
  { id: 'p2', category: 'photo', title: 'Photo réception partenaire', description: 'Confirmation visuelle de la réception chez Chez Bébé Pressing.', timestamp: '15 Mai 2026, 09:45' },
  { id: 'p3', category: 'photo', title: 'QC Checklist photo', description: 'Inspection qualité validée par l\'inspecteur Alpha.', timestamp: '15 Mai 2026, 14:10' },
  { id: 'p4', category: 'photo', title: 'Photo de livraison', description: 'Preuve de livraison avec signature du client.', timestamp: '15 Mai 2026, 15:45' },
  { id: 'py1', category: 'payment', title: 'Transaction M-Pesa', description: 'Paiement de $25.00 reçu via M-Pesa. TXN-884721.', timestamp: '15 Mai 2026, 08:14' },
  { id: 'py2', category: 'payment', title: 'Commission partenaire', description: 'Commission de $3.75 calculée automatiquement.', timestamp: '15 Mai 2026, 08:14' },
  { id: 'py3', category: 'payment', title: 'Facture générée', description: 'Proforma #PRF-2026-0515 émise au client.', timestamp: '15 Mai 2026, 08:15' },
  { id: 'l1', category: 'log', title: 'Order created', description: 'Commande ORD-0515 créée dans le système.', timestamp: '15 Mai 2026, 08:12' },
  { id: 'l2', category: 'log', title: 'Payment webhook received', description: 'Webhook M-Pesa confirmé et validé.', timestamp: '15 Mai 2026, 08:14' },
  { id: 'l3', category: 'log', title: 'Driver assigned atomically', description: 'Chauffeur assigné avec verrou SELECT FOR UPDATE.', timestamp: '15 Mai 2026, 08:30' },
  { id: 'l4', category: 'log', title: 'Pickup completed', description: 'Statut mis à jour : PICKED_UP avec géoloc.', timestamp: '15 Mai 2026, 09:05' },
  { id: 'l5', category: 'log', title: 'Received by partner', description: 'Partenaire a confirmé la réception.', timestamp: '15 Mai 2026, 09:45' },
  { id: 'l6', category: 'log', title: 'Cleaning in progress', description: 'Processus de nettoyage démarré.', timestamp: '15 Mai 2026, 11:20' },
  { id: 'l7', category: 'log', title: 'QC passed', description: 'Checklist qualité validée.', timestamp: '15 Mai 2026, 14:10' },
  { id: 'l8', category: 'log', title: 'Delivery driver assigned', description: 'Chauffeur de livraison assigné.', timestamp: '15 Mai 2026, 14:30' },
  { id: 'l9', category: 'log', title: 'Delivery in progress', description: 'Livraison en cours vers le client.', timestamp: '15 Mai 2026, 15:30' },
  { id: 'l10', category: 'log', title: 'Delivered', description: 'Livraison confirmée avec photo.', timestamp: '15 Mai 2026, 15:45' },
  { id: 'l11', category: 'log', title: 'Completed', description: 'Commande finalisée automatiquement.', timestamp: '15 Mai 2026, 16:00' },
  { id: 'l12', category: 'log', title: 'Invoice generated', description: 'Facture finale générée et envoyée.', timestamp: '15 Mai 2026, 16:01' },
  { id: 'd1', category: 'document', title: 'Proforma #PRF-2026-0515', description: 'Proforma détaillée pour la commande ORD-0515.', timestamp: '15 Mai 2026, 08:15' },
  { id: 'd2', category: 'document', title: 'Facture #INV-2026-0515', description: 'Facture officielle émise après livraison.', timestamp: '15 Mai 2026, 16:01' },
];

export default function EvidenceCenter({ evidence = mockEvidence }: EvidenceCenterProps) {
  const [activeTab, setActiveTab] = useState<EvidenceCategory>('photo');

  const filteredEvidence = evidence.filter((e) => e.category === activeTab);
  const countByCategory = evidence.reduce<Record<EvidenceCategory, number>>(
    (counts, item) => ({ ...counts, [item.category]: counts[item.category] + 1 }),
    { photo: 0, payment: 0, log: 0, document: 0 }
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">EVIDENCE CENTER</h3>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex min-w-[120px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon name={tab.icon as any} className="w-3.5 h-3.5" />
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              activeTab === tab.key ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {countByCategory[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Evidence grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filteredEvidence.map((item) => {
          const colorClass = categoryColors[item.category] ?? 'bg-gray-100 text-gray-600';
          return (
            <div
              key={item.id}
              className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon name={categoryIcons[item.category] ?? 'document'} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{item.timestamp}</span>
                </div>
              </div>

              <button type="button" className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                <Icon name="arrow-down-tray" className="w-3.5 h-3.5" />
                Télécharger preuve
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
