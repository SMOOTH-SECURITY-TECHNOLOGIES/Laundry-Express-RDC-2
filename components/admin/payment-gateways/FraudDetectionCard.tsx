import type { FraudMetrics } from '../../../lib/admin/payment-gateways-types';

export function FraudDetectionCard({ fraud }: { fraud: FraudMetrics }) {
  const color = fraud.score > 70 ? 'text-red-600' : fraud.score > 40 ? 'text-amber-600' : 'text-green-600';
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Fraud Monitoring</h3>
      <p className={`text-4xl font-bold ${color}`}>{fraud.score}<span className="text-lg text-gray-400">/100</span></p>
      <ul className="mt-4 space-y-1 text-sm text-gray-600">
        <li>Paiements répétés: {fraud.repeatedPayments}</li>
        <li>Montants suspects: {fraud.suspiciousAmounts}</li>
        <li>Remboursements abusifs: {fraud.abusiveRefunds}</li>
        <li>Tentatives multiples: {fraud.multipleAttempts}</li>
      </ul>
    </div>
  );
}
