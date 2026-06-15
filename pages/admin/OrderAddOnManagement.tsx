import React, { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { OrderAddOnItem, realApi } from '../../services/real-api';
import { slugifyAddOn } from '../../utils/order-addons';

type FormState = {
  slug: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  sort_order: number;
  is_active: boolean;
};

const initialForm: FormState = {
  slug: '',
  name: '',
  description: '',
  image_url: '',
  price: 0,
  sort_order: 0,
  is_active: true,
};

export const OrderAddOnManagement: React.FC = () => {
  const { addNotification } = useAppContext();
  const [items, setItems] = useState<OrderAddOnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await realApi.getAdminOrderAddOns();
      setItems(response.add_ons || []);
    } catch {
      setItems([]);
      addNotification('Impossible de charger les options complementaires.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...initialForm, sort_order: items.length + 1 });
    setFormVisible(true);
  };

  const openEdit = (item: OrderAddOnItem) => {
    setEditingId(item.id);
    setForm({
      slug: item.slug,
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      price: typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price),
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      addNotification('Le nom est obligatoire.', 'error');
      return;
    }
    const slug = form.slug.trim() || slugifyAddOn(form.name);
    setSaving(true);
    try {
      if (editingId) {
        await realApi.updateAdminOrderAddOn(editingId, {
          slug,
          name: form.name.trim(),
          description: form.description.trim(),
          image_url: form.image_url.trim(),
          price: form.price,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        addNotification('Option mise a jour.', 'success');
      } else {
        await realApi.createAdminOrderAddOn({
          slug,
          name: form.name.trim(),
          description: form.description.trim(),
          image_url: form.image_url.trim(),
          price: form.price,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        addNotification('Option creee.', 'success');
      }
      closeForm();
      await loadItems();
    } catch {
      addNotification('Enregistrement impossible.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: OrderAddOnItem) => {
    try {
      await realApi.updateAdminOrderAddOn(item.id, { is_active: !item.is_active });
      await loadItems();
    } catch {
      addNotification('Mise a jour impossible.', 'error');
    }
  };

  const handleDelete = async (item: OrderAddOnItem) => {
    if (!window.confirm(`Desactiver « ${item.name} » ?`)) return;
    try {
      await realApi.deactivateAdminOrderAddOn(item.id);
      addNotification('Option desactivee.', 'success');
      await loadItems();
    } catch {
      addNotification('Suppression impossible.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Options complementaires</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Configurez la section « Vous pourriez aussi avoir besoin de » affichee lors de la commande pressing.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-700"
        >
          <Icon name="plus" className="w-4 h-4" />
          Ajouter une option
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          Aucune option configuree.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="flex gap-3">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                    <Icon name="shoppingBag" className="w-6 h-6 text-brand-blue" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{item.name}</h3>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                  <p className="text-sm font-bold text-brand-blue mt-2">
                    {typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : Number(item.price).toFixed(2)} $
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">slug: {item.slug} · ordre: {item.sort_order}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                <button type="button" onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Icon name="pencil" className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => handleDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Icon name="xmark" className="w-5 h-5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {formVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingId ? 'Modifier l option' : 'Nouvelle option'}
            </h2>
            <label className="block text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Nom</span>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Slug (identifiant)</span>
              <input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder={slugifyAddOn(form.name) || 'ex: nettoyage-chaussures'}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">URL image</span>
              <input
                value={form.image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Prix ($)</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Ordre</span>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm((prev) => ({ ...prev, sort_order: parseInt(e.target.value, 10) || 0 }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              Option active
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl bg-slate-100 font-semibold">
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-brand-blue text-white font-semibold disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
