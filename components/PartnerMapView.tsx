import React, { useEffect, useRef } from 'react';
import { Partner } from '../types';
import { useAppContext } from '../context/AppContext';

interface PartnerMapViewProps {
  partners: Partner[];
  onSelectPartner: (partner: Partner) => void;
}

export const PartnerMapView: React.FC<PartnerMapViewProps> = ({ partners, onSelectPartner }) => {
  const { t } = useAppContext();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
        const map = L.map(mapContainerRef.current).setView([-4.325, 15.3222], 13);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }
    
    // Add/Update markers
    if (mapRef.current) {
        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        partners.forEach(partner => {
            const marker = L.marker([partner.coordinates.lat, partner.coordinates.lng]).addTo(mapRef.current);
            markersRef.current.push(marker);
            
            const popupContent = `
                <div class="font-sans" style="min-width: 180px;">
                    <h3 class="font-bold text-base mb-1">${partner.name}</h3>
                    <div class="flex items-center text-sm mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-yellow-400"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" /></svg>
                        <span class="ml-1 font-semibold text-slate-700">${partner.rating}</span>
                        <span class="ml-2 text-slate-500 text-xs">(${t('pressingSelector.reviews', { count: partner.reviewCount })})</span>
                    </div>
                    <button id="select-partner-${partner.id}" class="w-full mt-1 px-3 py-1.5 text-sm bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90">
                        ${t('partnerMapView.select')}
                    </button>
                </div>
            `;
            marker.bindPopup(popupContent);

            marker.on('popupopen', () => {
                const btn = document.getElementById(`select-partner-${partner.id}`);
                if (btn) {
                    btn.onclick = () => onSelectPartner(partner);
                }
            });
        });

        if (partners.length > 0) {
            const group = L.featureGroup(markersRef.current);
            mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }
    
  }, [partners, onSelectPartner, t]);
  
  return (
     <div ref={mapContainerRef} className="relative w-full h-[600px] bg-slate-200 rounded-lg overflow-hidden z-10">
         {/* Leaflet map will be rendered here */}
     </div>
  );
};