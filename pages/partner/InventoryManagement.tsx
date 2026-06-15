import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { InventoryItem, Partner, PartnerSection } from '../../types';
import { DB } from '../../constants';
import { findPartner } from '../../utils/findPartner';
import { ConsumableFormValues, InventoryItemModal } from './inventory/InventoryItemModal';
import { InventoryItemThumb } from './inventory/InventoryItemThumb';
import { partnerCard } from './partner-ui';

interface InventoryProps {
  setSection?: (section: PartnerSection) => void;
}

interface Consumable extends ConsumableFormValues {
  id: string;
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  lastOrder: string;
  total: number;
}

interface AutomationRule {
  id: string;
  rule: string;
  condition: string;
  action: string;
  enabled: boolean;
}

interface StockMovement {
  id: string;
  date: string;
  article: string;
  action: 'Entrée' | 'Consommation' | 'Ajustement' | 'Commande';
  qty: string;
  user: string;
  color: string;
}

const INITIAL_CONSUMABLES: Consumable[] = [
  {
    id: 'inv-1',
    name: 'Lessive industrielle',
    category: 'Lessive',
    stock: 12,
    unit: 'L',
    threshold: 20,
    cost: 32,
    icon: '🧪',
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'inv-2',
    name: 'Détachant puissant',
    category: 'Détachant',
    stock: 1.8,
    unit: 'L',
    threshold: 5,
    cost: 18,
    icon: '🧴',
    imageUrl: 'https://images.unsplash.com/photo-1606724553879-4c01add4acb2?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'inv-3',
    name: 'Assouplissant',
    category: 'Assouplissant',
    stock: 8,
    unit: 'L',
    threshold: 15,
    cost: 14,
    icon: '💧',
    imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80d0ae7?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'inv-4',
    name: 'Sacs de livraison',
    category: 'Emballage',
    stock: 10,
    unit: 'unités',
    threshold: 30,
    cost: 0.25,
    icon: '🛍️',
    imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c6672c66f38?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'inv-5',
    name: 'Housses vêtements',
    category: 'Emballage',
    stock: 45,
    unit: 'unités',
    threshold: 50,
    cost: 0.15,
    icon: '👔',
    imageUrl: 'https://images.unsplash.com/photo-1558171813-4c002d410855?auto=format&fit=crop&w=160&q=80',
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'CleanPro RDC', phone: '+243 81 234 56 78', lastOrder: '18 Mai 2026', total: 320 },
  { id: 'sup-2', name: 'Wash Supplies', phone: '+243 90 987 65 43', lastOrder: '10 Mai 2026', total: 210 },
  { id: 'sup-3', name: 'ProDet Cleaners', phone: '+243 97 654 32 10', lastOrder: '02 Mai 2026', total: 150 },
  { id: 'sup-4', name: 'RDC Packaging', phone: '+243 81 456 78 90', lastOrder: '15 Mai 2026', total: 95 },
];

const INITIAL_AUTOMATIONS: AutomationRule[] = [
  { id: 'auto-1', rule: 'Alerte stock faible', condition: 'Stock Lessive industrielle < 10 L', action: 'Notifier par email & WhatsApp', enabled: true },
  { id: 'auto-2', rule: 'Alerte stock faible', condition: 'Stock Sacs de livraison < 20 unités', action: 'Notifier par email & WhatsApp', enabled: true },
  { id: 'auto-3', rule: 'Maintenance machine', condition: 'Machine maintenance dans 7 jours', action: 'Notification push', enabled: false },
];

const INITIAL_MOVEMENTS: StockMovement[] = [
  { id: 'mov-1', date: '25 Mai', article: 'Lessive', action: 'Entrée', qty: '+20 L', user: 'Patrice', color: 'text-[#22C55E]' },
  { id: 'mov-2', date: '26 Mai', article: 'Lessive', action: 'Consommation', qty: '-3 L', user: 'Système', color: 'text-brand-blue' },
  { id: 'mov-3', date: '27 Mai', article: 'Sacs', action: 'Entrée', qty: '+50', user: 'Patrice', color: 'text-[#22C55E]' },
  { id: 'mov-4', date: '28 Mai', article: 'Assouplissant', action: 'Consommation', qty: '-1.5 L', user: 'Système', color: 'text-brand-blue' },
  { id: 'mov-5', date: '28 Mai', article: 'Détachant', action: 'Ajustement', qty: '-0.2 L', user: 'Patrice', color: 'text-[#FF7A00]' },
];

const mapUnitToApi = (unit: string): InventoryItem['unit'] => {
  if (unit === 'L') return 'liters';
  if (unit === 'kg') return 'kg';
  return 'units';
};

const mapApiUnitToUi = (unit: InventoryItem['unit']): string => {
  if (unit === 'liters') return 'L';
  if (unit === 'kg') return 'kg';
  return 'unités';
};

const toApiInventory = (items: Consumable[]): InventoryItem[] =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    unit: mapUnitToApi(item.unit),
    currentStock: item.stock,
    lowStockThreshold: item.threshold,
    imageUrl: item.imageUrl || undefined,
    category: item.category,
    cost: item.cost,
  }));

const fromApiInventory = (items: InventoryItem[]): Consumable[] =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category || 'Consommable',
    stock: item.currentStock,
    unit: mapApiUnitToUi(item.unit),
    threshold: item.lowStockThreshold,
    cost: item.cost ?? 0,
    icon: '📦',
    imageUrl: item.imageUrl || '',
  }));

const mergeInventoryWithDefaults = (apiItems: InventoryItem[], defaults: Consumable[]): Consumable[] => {
  if (!apiItems.length) return defaults;
  const defaultById = new Map(defaults.map((d) => [d.id, d]));
  const defaultByName = new Map(defaults.map((d) => [d.name.toLowerCase(), d]));
  return apiItems.map((item) => {
    const mapped = fromApiInventory([item])[0];
    const fallback = defaultById.get(item.id) || defaultByName.get(item.name.toLowerCase());
    if (!mapped.imageUrl?.trim() && fallback?.imageUrl) {
      return {
        ...mapped,
        imageUrl: fallback.imageUrl,
        icon: fallback.icon,
        category: mapped.category === 'Consommable' ? fallback.category : mapped.category,
        cost: mapped.cost || fallback.cost,
      };
    }
    return mapped;
  });
};

const readStoredInventory = (partnerId: string): Consumable[] => {
  const dbPartners = DB.get('partners') as Partner[];
  const stored = dbPartners.find((p) => p.id === partnerId)?.inventory;
  if (stored?.length) {
    return mergeInventoryWithDefaults(stored, INITIAL_CONSUMABLES);
  }
  return INITIAL_CONSUMABLES;
};

/* ─── SVG Donut ─── */
const Donut: React.FC<{ segments: { value: number; color: string; label: string }[]; size?: number }> = ({
  segments,
  size = 120,
}) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const dash = (pct / 100) * circumference;
          const prev = cumulative;
          cumulative += pct;
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={(-prev / 100) * circumference}
            />
          );
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="truncate text-content-muted">{seg.label}</span>
            <span className="ml-auto font-bold text-content-primary">
              {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InventoryManagement: React.FC<InventoryProps> = ({ setSection }) => {
  const { user, partners, formatPrice, addNotification, apiUpdatePartnerInventory } = useAppContext();
  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);

  const [consumables, setConsumables] = useState<Consumable[]>(INITIAL_CONSUMABLES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [automations, setAutomations] = useState<AutomationRule[]>(INITIAL_AUTOMATIONS);
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [movementFilter, setMovementFilter] = useState<'all' | 'Entrée' | 'Consommation' | 'Ajustement'>('all');
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);

  const [itemModal, setItemModal] = useState<{ mode: 'add' | 'edit'; item?: Consumable } | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '' });
  const [ruleForm, setRuleForm] = useState({ rule: '', condition: '', action: '' });

  useEffect(() => {
    if (!partner) return;
    setConsumables(readStoredInventory(partner.id));
  }, [partner?.id]);

  const persistInventory = useCallback(
    async (items: Consumable[]) => {
      if (!partner) return;
      try {
        await apiUpdatePartnerInventory(partner.id, toApiInventory(items));
      } catch {
        addNotification("Impossible de synchroniser l'inventaire avec le serveur.", 'error');
      }
    },
    [partner, apiUpdatePartnerInventory, addNotification],
  );

  const pushMovement = (movement: Omit<StockMovement, 'id'>) => {
    setMovements((prev) => [{ ...movement, id: `mov-${Date.now()}` }, ...prev]);
  };

  const handleSaveItem = async (values: ConsumableFormValues) => {
    if (!itemModal) return;
    const normalized: ConsumableFormValues = {
      ...values,
      imageUrl: values.imageUrl.trim(),
    };
    let next: Consumable[];
    if (itemModal.mode === 'add') {
      const created: Consumable = { ...normalized, id: `inv-${Date.now()}` };
      next = [...consumables, created];
      pushMovement({
        date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        article: created.name,
        action: 'Entrée',
        qty: `+${created.stock} ${created.unit}`,
        user: user?.name || 'Vous',
        color: 'text-[#22C55E]',
      });
      addNotification(`Article « ${created.name} » ajouté à l'inventaire.`, 'success');
    } else if (itemModal.item) {
      next = consumables.map((c) => (c.id === itemModal.item!.id ? { ...c, ...normalized } : c));
      addNotification(`Article « ${normalized.name} » mis à jour.`, 'success');
    } else {
      return;
    }
    setConsumables(next);
    setItemModal(null);
    await persistInventory(next);
  };

  const handleOrderItem = (item: Consumable) => {
    const reorderQty = Math.max(item.threshold - item.stock, 1);
    pushMovement({
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      article: item.name,
      action: 'Commande',
      qty: `+${reorderQty} ${item.unit}`,
      user: user?.name || 'Vous',
      color: 'text-[#22C55E]',
    });
    addNotification(
      `Commande enregistrée pour ${item.name} (${reorderQty} ${item.unit}). Le fournisseur sera notifié.`,
      'success',
    );
  };

  const handleAddSupplier = () => {
    if (!supplierForm.name.trim()) {
      addNotification('Indiquez le nom du fournisseur.', 'error');
      return;
    }
    const created: Supplier = {
      id: `sup-${Date.now()}`,
      name: supplierForm.name.trim(),
      phone: supplierForm.phone.trim() || '—',
      lastOrder: '—',
      total: 0,
    };
    setSuppliers((prev) => [...prev, created]);
    setSupplierForm({ name: '', phone: '' });
    setShowSupplierModal(false);
    addNotification(`Fournisseur « ${created.name} » ajouté.`, 'success');
  };

  const handleAddRule = () => {
    if (!ruleForm.rule.trim() || !ruleForm.condition.trim()) {
      addNotification('Remplissez le nom et la condition de la règle.', 'error');
      return;
    }
    const created: AutomationRule = {
      id: `auto-${Date.now()}`,
      rule: ruleForm.rule.trim(),
      condition: ruleForm.condition.trim(),
      action: ruleForm.action.trim() || 'Notifier',
      enabled: true,
    };
    setAutomations((prev) => [...prev, created]);
    setRuleForm({ rule: '', condition: '', action: '' });
    setShowRuleModal(false);
    addNotification('Règle d\'automatisation créée.', 'success');
  };

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const enabled = !a.enabled;
        addNotification(`Règle « ${a.rule} » ${enabled ? 'activée' : 'désactivée'}.`, 'info');
        return { ...a, enabled };
      }),
    );
  };

  const handleExport = (label: string, format: string) => {
    addNotification(`Export ${label} (${format}) en cours de préparation…`, 'info');
  };

  const equipment = useMemo(
    () => [
      { name: 'Machine LG 40kg', state: 'Opérationnelle', lastMaint: '25 Avril 2026', nextMaint: '30 Mai 2026', daysLeft: 5 },
      { name: 'Séchoir industriel', state: 'Opérationnelle', lastMaint: '20 Avril 2026', nextMaint: '20 Mai 2026', daysLeft: 0 },
      { name: 'Repassage vapeur', state: 'Opérationnelle', lastMaint: '10 Avril 2026', nextMaint: '10 Juin 2026', daysLeft: 16 },
      { name: 'Machine 20kg', state: 'En maintenance', lastMaint: '05 Mai 2026', nextMaint: '15 Mai 2026', daysLeft: -1 },
      { name: 'Compresseur d\'air', state: 'Opérationnelle', lastMaint: '18 Avril 2026', nextMaint: '18 Juin 2026', daysLeft: 24 },
    ],
    [],
  );

  const stats = useMemo(() => {
    const alerts = consumables.filter((c) => c.stock < c.threshold * 0.5).length;
    const criticaItems = consumables.filter((c) => c.stock < c.threshold * 0.2).length;
    const stockValue = consumables.reduce((s, c) => s + c.stock * c.cost, 0);
    return { totalItems: consumables.length, alerts, stockValue, monthlyConsumption: 85, criticaItems, reorderIn: 5 };
  }, [consumables]);

  const consumptionData = useMemo(() => {
    const days = 30;
    const result: { label: string; values: { name: string; value: number; color: string }[] }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i -= 3) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      result.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        values: [
          { name: 'Lessive', value: 20 + Math.random() * 30, color: '#005bd8' },
          { name: 'Détachant', value: 10 + Math.random() * 15, color: '#22C55E' },
          { name: 'Assouplissant', value: 8 + Math.random() * 10, color: '#8B5CF6' },
          { name: 'Sacs', value: 5 + Math.random() * 8, color: '#FF7A00' },
        ],
      });
    }
    return result;
  }, []);

  const filteredMovements = useMemo(() => {
    if (movementFilter === 'all') return movements;
    return movements.filter((m) => m.action === movementFilter);
  }, [movements, movementFilter]);

  const alertItems = consumables.filter((c) => c.stock < c.threshold * 0.5);

  if (!partner) return null;

  const inventoryScore = 85;
  const fieldClass =
    'w-full rounded-lg border border-surface-border-subtle bg-surface-muted px-3 py-2 text-sm text-content-primary';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-content-primary md:text-3xl">Inventaire & Fournitures</h1>
          <p className="mt-1 text-sm text-content-muted">
            Suivez vos consommables, machines et anticipez les ruptures de stock.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setItemModal({ mode: 'add' })}
          className="flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-blue-700"
        >
          <Icon name="plus" className="h-4 w-4" />
          Ajouter un article
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Consommables actifs', value: String(stats.totalItems), change: '+3 ce mois', icon: 'archive-box', bg: 'bg-blue-50', color: 'text-brand-blue' },
          { label: 'Alertes stock', value: String(stats.alerts), sub: 'Voir les alertes', icon: 'warning', bg: 'bg-orange-50', color: 'text-[#FF7A00]', alert: stats.alerts > 0, action: () => setShowAlertsOnly(true) },
          { label: 'Valeur stock', value: formatPrice(stats.stockValue), change: '+12% ce mois', icon: 'currencyDollar', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: 'Consommation mois', value: formatPrice(stats.monthlyConsumption), change: '+8% ce mois', icon: 'chartBar', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Produits critiques', value: String(stats.criticaItems), sub: 'Voir détails', icon: 'heart', bg: 'bg-red-50', color: 'text-red-500', action: () => setShowAlertsOnly(true) },
          { label: 'Réapprovisionnement', value: `Dans ${stats.reorderIn} j`, sub: 'Prévu le 28 Mai', icon: 'calendar', bg: 'bg-cyan-50', color: 'text-cyan-600' },
        ].map((kpi, i) => (
          <div key={i} className={`${partnerCard} p-4 transition hover:shadow-md ${kpi.alert ? 'border-orange-200' : ''}`}>
            <div className={`mb-2 w-fit rounded-xl p-2 ${kpi.bg}`}>
              <Icon name={kpi.icon as any} className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className="mb-0.5 text-[10px] text-content-muted">{kpi.label}</p>
            <p className="text-lg font-extrabold text-content-primary">{kpi.value}</p>
            {kpi.change && <p className="mt-0.5 text-[10px] font-bold text-[#22C55E]">{kpi.change}</p>}
            {kpi.sub && (
              <button
                type="button"
                onClick={kpi.action}
                className="mt-0.5 text-[10px] text-content-muted hover:text-brand-blue"
              >
                {kpi.sub}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={`${partnerCard} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-content-primary">Alertes de stock</h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">{stats.alerts}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAlertsOnly((v) => !v)}
            className="text-xs font-bold text-brand-blue hover:underline"
          >
            {showAlertsOnly ? 'Voir tout l\'inventaire →' : 'Voir toutes les alertes →'}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(showAlertsOnly ? alertItems : alertItems.slice(0, 3)).map((item) => {
            const pct = Math.round((item.stock / item.threshold) * 100);
            const barColor = pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-[#FF7A00]' : 'bg-[#22C55E]';
            return (
              <div key={item.id} className="rounded-xl border border-surface-border-subtle bg-surface-muted p-4">
                <div className="mb-3 flex items-center gap-3">
                  <InventoryItemThumb key={item.imageUrl || item.id} name={item.name} imageUrl={item.imageUrl} icon={item.icon} size="lg" />
                  <div>
                    <p className="text-sm font-bold text-content-primary">{item.name}</p>
                    <p className="text-[10px] text-content-muted">
                      Stock restant : {pct}% ({item.stock} {item.unit})
                    </p>
                  </div>
                </div>
                <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-content-muted">
                    Seuil : {item.threshold} {item.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOrderItem(item)}
                    className="rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-1 text-[10px] font-bold transition hover:bg-surface-muted"
                  >
                    Commander
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`${partnerCard} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-content-primary">Consommables</h2>
            <button
              type="button"
              onClick={() => setShowAlertsOnly(false)}
              className="text-xs font-bold text-brand-blue hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border-subtle">
                  <th className="py-2 text-left text-[10px] text-content-muted">ARTICLE</th>
                  <th className="py-2 text-left text-[10px] text-content-muted">STOCK</th>
                  <th className="py-2 text-center text-[10px] text-content-muted">STATUT</th>
                  <th className="py-2 text-right text-[10px] text-content-muted">COÛT</th>
                  <th className="py-2 text-center text-[10px] text-content-muted">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {consumables.map((item) => {
                  const pct = Math.round((item.stock / item.threshold) * 100);
                  const status =
                    pct < 20
                      ? { label: 'Alerte', color: 'bg-red-50 text-red-600' }
                      : pct < 50
                        ? { label: 'Attention', color: 'bg-orange-50 text-[#FF7A00]' }
                        : { label: 'OK', color: 'bg-green-50 text-[#22C55E]' };
                  return (
                    <tr key={item.id} className="border-b border-surface-border-subtle last:border-0">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <InventoryItemThumb key={item.imageUrl || item.id} name={item.name} imageUrl={item.imageUrl} icon={item.icon} />
                          <div>
                            <p className="text-xs font-bold text-content-primary">{item.name}</p>
                            <p className="text-[10px] text-content-muted">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-xs font-medium text-content-primary">
                        {item.stock} {item.unit}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-xs font-bold text-content-primary">
                        {formatPrice(item.cost)}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setItemModal({ mode: 'edit', item })}
                          className="rounded p-1 hover:bg-surface-muted"
                          aria-label={`Modifier ${item.name}`}
                        >
                          <Icon name="pencil" className="h-3 w-3 text-content-muted" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${partnerCard} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-content-primary">Machines & Équipements</h2>
            <button
              type="button"
              onClick={() => addNotification('Planning de maintenance ouvert.', 'info')}
              className="text-xs font-bold text-brand-blue hover:underline"
            >
              Gérer les maintenances →
            </button>
          </div>
          <div className="space-y-2.5">
            {equipment.map((eq, i) => {
              const stateColor =
                eq.state === 'Opérationnelle'
                  ? 'bg-green-50 text-[#22C55E]'
                  : eq.state === 'En maintenance'
                    ? 'bg-orange-50 text-[#FF7A00]'
                    : 'bg-red-50 text-red-500';
              const daysColor = eq.daysLeft < 0 ? 'text-red-500' : eq.daysLeft <= 7 ? 'text-[#FF7A00]' : 'text-content-muted';
              return (
                <div key={i} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <Icon name="truck" className="h-4 w-4 text-brand-blue" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-content-primary">{eq.name}</p>
                      <p className="text-[10px] text-content-muted">Maint. : {eq.lastMaint}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${stateColor}`}>{eq.state}</span>
                    <p className={`mt-0.5 text-[10px] font-medium ${daysColor}`}>
                      {eq.daysLeft < 0
                        ? `En retard (${Math.abs(eq.daysLeft)}j)`
                        : eq.daysLeft === 0
                          ? "Aujourd'hui"
                          : `${eq.daysLeft} jours`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`${partnerCard} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-content-primary">Consommation des 30 derniers jours</h2>
            <span className="rounded-lg bg-surface-muted px-2 py-1 text-[10px] font-medium text-content-muted">30 jours</span>
          </div>
          <svg viewBox="0 0 400 150" className="h-36 w-full">
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <g key={i}>
                <line x1="40" y1={10 + (1 - pct) * 130} x2="390" y2={10 + (1 - pct) * 130} stroke="#F1F5F9" strokeWidth="1" />
              </g>
            ))}
            {['Lessive', 'Détachant', 'Assouplissant', 'Sacs'].map((name, si) => {
              const color = ['#005bd8', '#22C55E', '#8B5CF6', '#FF7A00'][si];
              const max = 50;
              const pts = consumptionData
                .map((d, i) => `${40 + (i / (consumptionData.length - 1)) * 350},${10 + (1 - (d.values[si]?.value || 0) / max) * 130}`)
                .join(' ');
              return <polyline key={si} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={pts} />;
            })}
          </svg>
        </div>

        <div className={`${partnerCard} p-5`}>
          <h2 className="mb-4 text-lg font-bold text-content-primary">Coût opérationnel ce mois</h2>
          <Donut
            segments={[
              { value: 85, color: '#005bd8', label: 'Consommables' },
              { value: 60, color: '#22C55E', label: 'Eau' },
              { value: 80, color: '#8B5CF6', label: 'Electricité' },
              { value: 50, color: '#FF7A00', label: 'Maintenance' },
              { value: 45, color: '#64748B', label: 'Transport' },
            ]}
            size={130}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`${partnerCard} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-content-primary">Fournisseurs</h2>
            <button
              type="button"
              onClick={() => setShowSupplierModal(true)}
              className="flex items-center gap-1 rounded-lg bg-brand-blue px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-brand-blue-700"
            >
              <Icon name="plus" className="h-3 w-3" />
              Ajouter
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border-subtle">
                <th className="py-2 text-left text-[10px] text-content-muted">FOURNISSEUR</th>
                <th className="py-2 text-left text-[10px] text-content-muted">TÉLÉPHONE</th>
                <th className="py-2 text-right text-[10px] text-content-muted">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-surface-border-subtle last:border-0">
                  <td className="py-2.5 text-xs font-bold text-content-primary">{s.name}</td>
                  <td className="py-2.5 text-xs text-content-muted">{s.phone}</td>
                  <td className="py-2.5 text-right text-xs font-bold text-content-primary">{formatPrice(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`${partnerCard} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-content-primary">Automatisation & Alertes</h2>
            <button
              type="button"
              onClick={() => setShowRuleModal(true)}
              className="flex items-center gap-1 rounded-lg bg-brand-blue px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-brand-blue-700"
            >
              <Icon name="plus" className="h-3 w-3" />
              Nouvelle règle
            </button>
          </div>
          <div className="space-y-3">
            {automations.map((a) => (
              <div key={a.id} className="rounded-xl bg-surface-muted p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-bold text-content-primary">{a.rule}</p>
                  <button
                    type="button"
                    onClick={() => toggleAutomation(a.id)}
                    className={`h-4.5 w-8 rounded-full p-0.5 transition-colors ${a.enabled ? 'bg-[#22C55E]' : 'bg-slate-300'}`}
                    aria-label={a.enabled ? 'Désactiver' : 'Activer'}
                  >
                    <div className={`h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${a.enabled ? 'translate-x-3.5' : ''}`} />
                  </button>
                </div>
                <p className="mb-1 text-[10px] text-content-muted">Si {a.condition}</p>
                <p className="text-[10px] text-brand-blue">Action : {a.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`${partnerCard} p-5`}>
          <h2 className="mb-4 text-lg font-bold text-content-primary">Mouvements de stock</h2>
          <div className="mb-3 flex gap-1.5">
            {(
              [
                { key: 'all', label: 'Tous' },
                { key: 'Entrée', label: 'Entrées' },
                { key: 'Consommation', label: 'Sorties' },
                { key: 'Ajustement', label: 'Ajustements' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setMovementFilter(f.key)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                  movementFilter === f.key ? 'bg-brand-blue text-white' : 'bg-surface-muted text-content-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-surface-border-subtle py-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[10px] text-content-muted">{m.date}</span>
                  <span className="text-xs font-medium text-content-primary">{m.article}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-content-muted">{m.user}</span>
                  <span className={`text-xs font-bold ${m.color}`}>{m.qty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${partnerCard} p-5`}>
          <h2 className="mb-4 text-lg font-bold text-content-primary">Rapports & Export</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'document-text', label: 'Rapport inventaire', format: 'PDF' },
              { icon: 'arrow-down-tray', label: 'Consommation', format: 'Excel' },
              { icon: 'arrow-down-tray', label: 'Mouvements stock', format: 'CSV' },
              { icon: 'document-text', label: 'Évaluation stock', format: 'PDF' },
            ].map((exp) => (
              <button
                key={exp.label}
                type="button"
                onClick={() => handleExport(exp.label, exp.format)}
                className="flex items-center gap-3 rounded-xl bg-surface-muted p-3 transition hover:bg-surface-muted/80"
              >
                <Icon name={exp.icon as any} className="h-5 w-5 text-brand-blue" />
                <div className="text-left">
                  <p className="text-xs font-bold text-content-primary">{exp.label}</p>
                  <p className="text-[10px] text-content-muted">{exp.format}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`${partnerCard} p-5`}>
        <h2 className="mb-3 text-lg font-bold text-content-primary">Santé de l'inventaire</h2>
        <p className="text-sm font-bold text-[#22C55E]">Score : {inventoryScore}/100 — Excellent</p>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-blue-700 p-5 md:flex-row">
        <div className="flex items-center gap-4">
          <span className="text-3xl">📦</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Anticipez vos besoins et évitez les ruptures de stock</h3>
            <p className="text-xs text-white/80">Maintenez toujours un niveau optimal pour ne jamais manquer de produits.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const critical = alertItems[0];
            if (critical) handleOrderItem(critical);
            else addNotification('Aucun article critique à commander pour le moment.', 'info');
          }}
          className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-blue transition hover:bg-white/90"
        >
          Commander maintenant
        </button>
      </div>

      <InventoryItemModal
        isOpen={!!itemModal}
        title={itemModal?.mode === 'edit' ? 'Modifier l\'article' : 'Ajouter un article'}
        initial={itemModal?.item}
        onClose={() => setItemModal(null)}
        onSave={handleSaveItem}
      />

      {showSupplierModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSupplierModal(false)} aria-hidden="true" />
          <div className={`relative w-full max-w-md ${partnerCard} p-6`}>
            <h2 className="mb-4 text-lg font-bold text-content-primary">Ajouter un fournisseur</h2>
            <div className="space-y-3">
              <input className={fieldClass} placeholder="Nom du fournisseur" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
              <input className={fieldClass} placeholder="Téléphone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowSupplierModal(false)} className="rounded-lg px-4 py-2 text-sm text-content-muted hover:bg-surface-muted">Annuler</button>
              <button type="button" onClick={handleAddSupplier} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {showRuleModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowRuleModal(false)} aria-hidden="true" />
          <div className={`relative w-full max-w-md ${partnerCard} p-6`}>
            <h2 className="mb-4 text-lg font-bold text-content-primary">Nouvelle règle d'alerte</h2>
            <div className="space-y-3">
              <input className={fieldClass} placeholder="Nom de la règle" value={ruleForm.rule} onChange={(e) => setRuleForm({ ...ruleForm, rule: e.target.value })} />
              <input className={fieldClass} placeholder="Condition (ex: Stock < 10 L)" value={ruleForm.condition} onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value })} />
              <input className={fieldClass} placeholder="Action" value={ruleForm.action} onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowRuleModal(false)} className="rounded-lg px-4 py-2 text-sm text-content-muted hover:bg-surface-muted">Annuler</button>
              <button type="button" onClick={handleAddRule} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white">Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
