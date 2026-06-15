import React, { useState, useEffect } from 'react';
import { Icon } from '../../Icon';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceData) => void;
}

interface CreateServiceData {
  name: string;
  category: string;
  description: string;
  basePrice: number;
  unit: 'per_article' | 'per_kg';
  slaTarget: string;
  status: 'active' | 'pending' | 'inactive';
  partners: string[];
}

const categories = [
  'Lavage',
  'Pressing',
  'Retouche',
  'Tapis',
  'Drap',
  'Spécial',
];

const units = [
  { value: 'per_article', label: 'Par article' },
  { value: 'per_kg', label: 'Par kg' },
];

const statuses = [
  { value: 'active', label: 'Actif' },
  { value: 'pending', label: 'En attente' },
  { value: 'inactive', label: 'Inactif' },
];

export default function CreateServiceModal({ isOpen, onClose, onSubmit }: CreateServiceModalProps) {
  const [formData, setFormData] = useState<CreateServiceData>({
    name: '',
    category: '',
    description: '',
    basePrice: 0,
    unit: 'per_article',
    slaTarget: '24h',
    status: 'active',
    partners: [],
  });
  const [partnerInput, setPartnerInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        category: '',
        description: '',
        basePrice: 0,
        unit: 'per_article',
        slaTarget: '24h',
        status: 'active',
        partners: [],
      });
      setPartnerInput('');
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPartner = () => {
    if (partnerInput.trim() && !formData.partners.includes(partnerInput.trim())) {
      setFormData(prev => ({
        ...prev,
        partners: [...prev.partners, partnerInput.trim()],
      }));
      setPartnerInput('');
    }
  };

  const handleRemovePartner = (partner: string) => {
    setFormData(prev => ({
      ...prev,
      partners: prev.partners.filter(p => p !== partner),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      basePrice: Number(formData.basePrice),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative w-full max-w-2xl mx-auto bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Icon name="plus" className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Créer un Service</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name="xmark" className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix de base (FCFA)</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SLA cible</label>
              <input
                type="text"
                name="slaTarget"
                value={formData.slaTarget}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: 24h, 48h, 72h"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partenaires</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={partnerInput}
                  onChange={(e) => setPartnerInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPartner())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ajouter un partenaire"
                />
                <button
                  type="button"
                  onClick={handleAddPartner}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Icon name="plus" className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              {formData.partners.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.partners.map((partner, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {partner}
                      <button
                        type="button"
                        onClick={() => handleRemovePartner(partner)}
                        className="hover:text-blue-600"
                      >
                        <Icon name="xmark" className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Créer le service
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}