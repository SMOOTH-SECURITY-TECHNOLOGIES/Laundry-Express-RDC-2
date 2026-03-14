import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { InventoryItem } from '../../types';
import { Icon } from '../../components/Icon';

const InventoryItemRow: React.FC<{
    item: InventoryItem;
    onUpdate: (item: InventoryItem) => void;
    onDelete: (itemId: string) => void;
}> = ({ item, onUpdate, onDelete }) => {
    
    const { t } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState(item);

    useEffect(() => {
        setFormState(item);
    }, [item]);
    
    const handleSave = () => {
        onUpdate(formState);
        setIsEditing(false);
    };

    const isLowStock = item.currentStock <= item.lowStockThreshold;

    if (isEditing) {
        return (
            <div className="p-4 bg-white dark:bg-slate-800 border-2 border-brand-blue rounded-lg space-y-3">
                <input 
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState(p => ({ ...p, name: e.target.value }))}
                    placeholder={t('inventoryManagement.itemName')}
                    className="w-full p-2 border rounded"
                />
                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={formState.unit}
                        onChange={(e) => setFormState(p => ({...p, unit: e.target.value as InventoryItem['unit']}))}
                        className="w-full p-2 border rounded bg-white"
                    >
                        <option value="pcs">{t('inventoryManagement.units.pcs')}</option>
                        <option value="liters">{t('inventoryManagement.units.liters')}</option>
                        <option value="kg">{t('inventoryManagement.units.kg')}</option>
                    </select>
                    <input
                        type="number"
                        value={formState.currentStock}
                        onChange={(e) => setFormState(p => ({...p, currentStock: Number(e.target.value) }))}
                        placeholder={t('inventoryManagement.currentStock')}
                        className="w-full p-2 border rounded"
                    />
                     <input
                        type="number"
                        value={formState.lowStockThreshold}
                        onChange={(e) => setFormState(p => ({...p, lowStockThreshold: Number(e.target.value) }))}
                        placeholder={t('inventoryManagement.lowStockThreshold')}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm bg-slate-200 rounded">{t('buttons.cancel')}</button>
                    <button onClick={handleSave} className="px-3 py-1 text-sm bg-brand-success text-white rounded">{t('buttons.saving')}</button>
                </div>
            </div>
        )
    }

    return (
        <div className={`p-4 rounded-lg flex items-center space-x-4 transition-colors ${isLowStock ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50 border border-transparent'}`}>
            <div className={`w-3 h-3 rounded-full shrink-0 ${isLowStock ? 'bg-orange-500' : 'bg-green-500'}`}></div>
            <div className="flex-grow">
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-sm text-slate-500">{t('inventoryManagement.stockLabel', { current: item.currentStock, threshold: item.lowStockThreshold, unit: t(`inventoryManagement.units.${item.unit}`) })}</p>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Icon name="pencil" className="w-5 h-5"/></button>
                <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Icon name="xmark" className="w-5 h-5"/></button>
            </div>
        </div>
    )
};


export const InventoryManagement: React.FC = () => {
    const { user, partners, apiUpdatePartnerInventory, t, addNotification } = useAppContext();
    const partner = partners.find(p => p.id === user?.partnerId);
    
    const [inventory, setInventory] = useState<InventoryItem[]>(partner?.inventory || []);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({ name: '', unit: 'pcs', currentStock: 0, lowStockThreshold: 0 });
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        setInventory(partner?.inventory || []);
    }, [partner]);
    
    const handleUpdate = (updatedItem: InventoryItem) => {
        setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    const handleDelete = (itemId: string) => {
        if (window.confirm(t('inventoryManagement.confirmDelete'))) {
            setInventory(prev => prev.filter(item => item.id !== itemId));
        }
    };
    
    const handleAddItem = () => {
        if (!newItem.name.trim()) {
            addNotification('Item name is required', 'error');
            return;
        }
        const newInventoryItem: InventoryItem = { ...newItem, id: `inv-${Date.now()}` };
        setInventory(prev => [...prev, newInventoryItem]);
        setNewItem({ name: '', unit: 'pcs', currentStock: 0, lowStockThreshold: 0 });
        setIsAdding(false);
    };

    const handleSaveAll = async () => {
        if (!partner) return;
        setIsSaving(true);
        try {
            await apiUpdatePartnerInventory(partner.id, inventory);
            addNotification(t('inventoryManagement.saveSuccess'), 'success');
        } catch(e) {
            addNotification(t('inventoryManagement.saveError'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('inventoryManagement.title')}</h1>
                <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 flex items-center space-x-2 disabled:bg-slate-400"
                >
                    <Icon name="check" className="w-5 h-5" />
                    <span>{isSaving ? t('buttons.saving') : t('inventoryManagement.saveChanges')}</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-card">
                 <p className="text-sm text-slate-600 mb-4">{t('inventoryManagement.description')}</p>
                <div className="space-y-3">
                    {inventory.map(item => (
                        <InventoryItemRow key={item.id} item={item} onUpdate={handleUpdate} onDelete={handleDelete} />
                    ))}
                </div>

                {!isAdding && (
                    <div className="mt-4">
                        <button onClick={() => setIsAdding(true)} className="w-full text-center py-3 border-2 border-dashed rounded-lg text-slate-500 hover:border-brand-blue hover:text-brand-blue transition-colors">
                           + {t('inventoryManagement.addItem')}
                        </button>
                    </div>
                )}

                {isAdding && (
                    <div className="mt-4 p-4 bg-slate-100 rounded-lg space-y-3 animate-fade-in">
                        <input
                            type="text"
                            value={newItem.name}
                            onChange={(e) => setNewItem(p => ({...p, name: e.target.value}))}
                            placeholder={t('inventoryManagement.itemName')}
                            className="w-full p-2 border rounded"
                        />
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select value={newItem.unit} onChange={(e) => setNewItem(p => ({...p, unit: e.target.value as any}))} className="w-full p-2 border rounded bg-white">
                                <option value="pcs">{t('inventoryManagement.units.pcs')}</option>
                                <option value="units">{t('inventoryManagement.units.units')}</option>
                                <option value="liters">{t('inventoryManagement.units.liters')}</option>
                                <option value="kg">{t('inventoryManagement.units.kg')}</option>
                            </select>
                            <input type="number" value={newItem.currentStock} onChange={(e) => setNewItem(p => ({...p, currentStock: Number(e.target.value)}))} placeholder={t('inventoryManagement.currentStock')} className="w-full p-2 border rounded" />
                            <input type="number" value={newItem.lowStockThreshold} onChange={(e) => setNewItem(p => ({...p, lowStockThreshold: Number(e.target.value)}))} placeholder={t('inventoryManagement.lowStockThreshold')} className="w-full p-2 border rounded" />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm bg-slate-200 rounded">{t('buttons.cancel')}</button>
                            <button onClick={handleAddItem} className="px-3 py-1 text-sm bg-brand-blue text-white rounded">{t('inventoryManagement.addItem')}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};