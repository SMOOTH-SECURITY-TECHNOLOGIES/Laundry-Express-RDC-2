import React from 'react';
import { Icon } from '../../Icon';
import type {
  OrphanPayment, UnbilledCollection, MissingCommission, SuspiciousRefund, UncollectedOrder, PayoutAnomaly,
} from '../../../lib/admin/revenue-leakage-types';

interface Props {
  orphans: OrphanPayment[];
  unbilled: UnbilledCollection[];
  commissions: MissingCommission[];
  refunds: SuspiciousRefund[];
  uncollected: UncollectedOrder[];
  payouts: PayoutAnomaly[];
  onAction: (id: string, action: string) => void;
}

function Block({ title, count, icon, color, children }: { title: string; count: number; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Icon name={icon as 'warning'} className="w-4 h-4" style={{ color }} /><h4 className="text-xs font-semibold text-gray-900 dark:text-slate-100">{title}</h4></div>
        <span className="text-lg font-bold" style={{ color }}>{count}</span>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

const th = 'text-left text-[9px] font-semibold text-gray-500 dark:text-slate-400 uppercase px-2 py-1';
const td = 'text-[10px] text-gray-800 dark:text-slate-200 px-2 py-1.5 border-t border-gray-50 dark:border-slate-800';

export function LeakageDetectionBlocks({ orphans, unbilled, commissions, refunds, uncollected, payouts, onAction }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <Block title="Paiements orphelins" count={orphans.length} icon="credit-card" color="#EF4444">
        <table className="w-full"><thead><tr><th className={th}>Payment ID</th><th className={th}>Montant</th><th className={th}>Provider</th><th className={th}>Age</th><th className={th}>Action</th></tr></thead>
          <tbody>{orphans.map((r) => (
            <tr key={r.id}><td className={td}>{r.id}</td><td className={td}>{r.amount} $</td><td className={td}>{r.provider}</td><td className={td}>{r.age}</td>
              <td className={td}><button type="button" onClick={() => onAction(r.id, 'investigate')} className="text-blue-600 text-[9px] font-medium">Investiguer</button></td></tr>
          ))}</tbody></table>
      </Block>

      <Block title="Collectes non facturées" count={unbilled.length} icon="document-text" color="#F59E0B">
        <table className="w-full"><thead><tr><th className={th}>Order</th><th className={th}>Partenaire</th><th className={th}>Montant</th><th className={th}>Age</th></tr></thead>
          <tbody>{unbilled.map((r) => (
            <tr key={r.orderId}><td className={td}>{r.orderId}</td><td className={td}>{r.partner}</td><td className={td}>{r.amount} $</td><td className={td}>{r.age}</td></tr>
          ))}</tbody></table>
      </Block>

      <Block title="Commissions manquantes" count={commissions.length} icon="currencyDollar" color="#2563EB">
        <table className="w-full"><thead><tr><th className={th}>Order</th><th className={th}>Partenaire</th><th className={th}>Attendue</th><th className={th}>Diff.</th></tr></thead>
          <tbody>{commissions.map((r) => (
            <tr key={r.orderId}><td className={td}>{r.orderId}</td><td className={td}>{r.partner}</td><td className={td}>{r.expected} $</td><td className={`${td} text-red-600 font-bold`}>{r.difference} $</td></tr>
          ))}</tbody></table>
      </Block>

      <Block title="Remboursements suspects" count={refunds.length} icon="warning" color="#EAB308">
        <table className="w-full"><thead><tr><th className={th}>Refund ID</th><th className={th}>Order</th><th className={th}>Montant</th><th className={th}>Score</th></tr></thead>
          <tbody>{refunds.map((r) => (
            <tr key={r.id}><td className={td}>{r.id}</td><td className={td}>{r.orderId}</td><td className={td}>{r.amount} $</td><td className={`${td} text-red-600`}>{r.riskScore}/100</td></tr>
          ))}</tbody></table>
      </Block>

      <Block title="Commandes non encaissées" count={uncollected.length} icon="shoppingBag" color="#9333EA">
        <table className="w-full"><thead><tr><th className={th}>Order</th><th className={th}>Client</th><th className={th}>Montant</th><th className={th}>Age</th></tr></thead>
          <tbody>{uncollected.map((r) => (
            <tr key={r.orderId}><td className={td}>{r.orderId}</td><td className={td}>{r.client}</td><td className={td}>{r.expectedAmount} $</td><td className={td}>{r.age}</td></tr>
          ))}</tbody></table>
      </Block>

      <Block title="Payouts anomalies" count={payouts.length} icon="wallet" color="#EF4444">
        <table className="w-full"><thead><tr><th className={th}>Payout ID</th><th className={th}>Partenaire</th><th className={th}>Montant</th><th className={th}>Statut</th></tr></thead>
          <tbody>{payouts.map((r) => (
            <tr key={r.id}><td className={td}>{r.id}</td><td className={td}>{r.partner}</td><td className={td}>{r.amount} $</td>
              <td className={td}><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r.status === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td></tr>
          ))}</tbody></table>
      </Block>
    </div>
  );
}
