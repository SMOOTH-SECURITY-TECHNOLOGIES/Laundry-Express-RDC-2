import React, { useState, useEffect } from 'react';
import { Icon } from '../../Icon';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PricingData) => void;
  services: { id: string; name: string; currentPrice: number }[];
}

interface PricingData {
  serviceId: string;
  serviceName: string;
  currentPrice: number;
  newPrice: number;
  effectiveDate: string;
  reason: string;
}

export default function PricingModal({ isOpen, onClose, onSubmit, services }: PricingModalProps) {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');

  const selectedService = services.find(s => s.id === selectedServiceId);

  useEffect(() => {
    if (!isOpen) {
      setSelectedServiceId('');
      setNewPrice(0);
      setEffectiveDate('');
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    
    onSubmit({
      serviceId: selectedServiceId,
      serviceName: selectedService.name,
      currentPrice: selectedService.currentPrice,
      newPrice,
      effectiveDate,
      reason,
    });
    onClose();
  };

  const calculateChange = () => {
    if (!selectedService || !newPrice) return null;
    const change = ((newPrice - selectedService.currentPrice) / selectedService.currentPrice) * 100;
    return change;
  };

  const changePercent = calculateChange();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative w-full max-w-lg mx-auto bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Icon name="gift" className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Modifier le Prix</h3>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  const service = services.find(s => s.id === e.target.value);
                  if (service) setNewPrice(service.currentPrice);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>
            {selectedService && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-500 mb-1">Prix actuel</label>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedService.currentPrice.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau prix (FCFA)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {changePercent !== null && (
                <div className={`mt-2 flex items-center gap-2 ${changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <Icon name={changePercent >= 0 ? 'arrowRight' : 'arrowLeft'} className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'effet</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Expliquez la raison du changement de prix..."
                required
              />
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
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Appliquer le nouveau prix
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}