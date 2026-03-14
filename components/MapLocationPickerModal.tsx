import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';
import { DrcAddress } from '../types';

interface MapLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (address: DrcAddress, coords: { lat: number; lng: number }) => void;
}

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = ({ isOpen, onClose, onLocationSelect }) => {
  const { t } = useAppContext();
  const [pinPosition, setPinPosition] = useState<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && mapContainerRef.current && !mapRef.current) {
        const map = L.map(mapContainerRef.current).setView([-4.325, 15.3222], 13);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            if (!markerRef.current) {
                const newMarker = L.marker([lat, lng]).addTo(map);
                markerRef.current = newMarker;
            } else {
                markerRef.current.setLatLng([lat, lng]);
            }
            setPinPosition({ lat, lng });
        });
        
        // Invalidate map size after modal is fully visible
        setTimeout(() => {
            map.invalidateSize();
        }, 400);
    }
  }, [isOpen]);
  
  const handleConfirm = () => {
      if (!pinPosition) return;
      // Simulate reverse geocoding to a structured address
      const mockAddress: DrcAddress = {
        numero: `${Math.round(pinPosition.lat * 100) % 100}`,
        avenue: 'Avenue de la Carte',
        quartier: 'Quartier Pin',
        commune: 'Gombe',
        reference: `Proche du point (${pinPosition.lat.toFixed(3)}, ${pinPosition.lng.toFixed(3)})`
      };
      onLocationSelect(mockAddress, pinPosition);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full relative animate-slide-up" onClick={(e) => e.stopPropagation()}>
         <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-20">
            <Icon name="xmark" className="w-6 h-6" />
        </button>
        <div className="p-6">
            <h2 className="text-2xl font-bold text-center text-brand-dark dark:text-slate-100 mb-4">{t('mapLocationPickerModal.title')}</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-4">{t('mapLocationPickerModal.instructions')}</p>
            <div 
              ref={mapContainerRef}
              className="relative w-full h-96 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden cursor-pointer"
            >
               {/* Map will be initialized here */}
            </div>
            <div className="mt-6 text-center">
                 <button 
                    onClick={handleConfirm}
                    disabled={!pinPosition}
                    className="px-8 py-3 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed text-lg"
                 >
                    {t('mapLocationPickerModal.confirm')}
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};