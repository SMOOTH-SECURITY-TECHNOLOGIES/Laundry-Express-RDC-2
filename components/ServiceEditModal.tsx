
import React, { useState, useEffect } from 'react';
import { Service, ServiceType } from '../types';
import { Icon } from './Icon';
import { ArticleCategoryEditor } from './ArticleCategoryEditor';

interface ServiceEditModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
}

const initialServiceState: Omit<Service, 'id'> = {
    type: ServiceType.PRESSING,
    title: '',
    description: '',
    iconName: 'shirt',
    imageUrl: 'https://picsum.photos/seed/new_service/400/200',
    priceModel: 'per_item',
    price: 0,
    articleCategories: [],
};

export const ServiceEditModal: React.FC<ServiceEditModalProps> = ({ service, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<Service, 'id'>>(() => 
    service ? { ...service } : initialServiceState
  );

  useEffect(() => {
    setFormData(service ? { ...service } : initialServiceState);
  }, [service, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value,
    }));
  };
  
  const handlePriceModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newPriceModel = e.target.value as 'per_kg' | 'per_item';
      setFormData(prev => ({
          ...prev,
          priceModel: newPriceModel,
          // Reset other model's data
          price: newPriceModel === 'per_item' ? 0 : prev.price,
          articleCategories: newPriceModel === 'per_kg' ? [] : prev.articleCategories,
          type: newPriceModel === 'per_kg' ? ServiceType.BLANCHISSERIE : ServiceType.PRESSING,
          iconName: newPriceModel === 'per_kg' ? 'wash' : 'shirt',
      }));
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceToSave: Service = {
        ...formData,
        id: service?.id || `SERV-${Date.now()}`,
    };
    onSave(serviceToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full relative">
         <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
            <Icon name="xmark" className="w-6 h-6" />
        </button>
        <div className="p-8">
            <h2 className="text-2xl font-bold text-brand-dark mb-6">{service ? 'Modifier le service' : 'Ajouter un service'}</h2>
            <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titre du service</label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg" placeholder="ex: Nettoyage à sec de costumes" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" id="description" rows={2} value={formData.description} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Une brève description du service."></textarea>
                </div>
                <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">URL de l'image du service</label>
                    <input type="text" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg" placeholder="https://example.com/image.png" />
                </div>
                <div>
                    <label htmlFor="priceModel" className="block text-sm font-medium text-gray-700 mb-1">Modèle de prix</label>
                    <select name="priceModel" id="priceModel" value={formData.priceModel} onChange={handlePriceModelChange} required className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                        <option value="per_item">Par article (Pressing)</option>
                        <option value="per_kg">Par kilo (Blanchisserie)</option>
                    </select>
                </div>
                
                {formData.priceModel === 'per_kg' && (
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Prix par KG ($)</label>
                        <input type="number" step="0.01" name="price" id="price" value={formData.price} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                )}
                
                {formData.priceModel === 'per_item' && (
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Gestion des articles</label>
                       <ArticleCategoryEditor 
                           categories={formData.articleCategories || []}
                           onChange={(newCategories) => setFormData(prev => ({...prev, articleCategories: newCategories}))}
                       />
                   </div>
                )}
                
                <div className="flex justify-end space-x-4 pt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Annuler
                    </button>
                    <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90">
                        Enregistrer
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
