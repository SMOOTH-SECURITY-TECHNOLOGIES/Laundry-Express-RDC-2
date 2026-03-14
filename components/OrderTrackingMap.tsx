import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { Icon } from './Icon';


export const OrderTrackingMap: React.FC<{ order: Order }> = ({ order }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const courierMarkerRef = useRef<any>(null);
    const animationIntervalRef = useRef<number | null>(null);

    if (!order.partner?.coordinates || !order.clientDetails?.coordinates) {
        return null;
    }
    
    const partnerLatLng: [number, number] = [order.partner.coordinates.lat, order.partner.coordinates.lng];
    const clientLatLng: [number, number] = [order.clientDetails.coordinates.lat, order.clientDetails.coordinates.lng];

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false });
            mapRef.current = map;
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            // Partner Icon
            const partnerIcon = L.divIcon({
                html: `<div class="p-2 bg-brand-dark rounded-full shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-white"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v16.5h16.5V3.75H3.75zM12 18a6 6 0 100-12 6 6 0 000 12zM12 15a3 3 0 100-6 3 3 0 000 6zM16.5 6h2.25" /></svg></div>`,
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });
            L.marker(partnerLatLng, { icon: partnerIcon }).addTo(map).bindPopup(`<b>${order.partner?.name}</b>`);
            
            // Client Icon
            const clientIcon = L.divIcon({
                html: `<div class="p-2 bg-brand-blue rounded-full shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-white"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg></div>`,
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });
            L.marker(clientLatLng, { icon: clientIcon }).addTo(map).bindPopup(`<b>Votre adresse</b>`);
            
            map.fitBounds([partnerLatLng, clientLatLng], { padding: [50, 50] });

            L.polyline([partnerLatLng, clientLatLng], { color: '#0077B6', dashArray: '5, 5' }).addTo(map);

            setTimeout(() => map.invalidateSize(), 100);
        }
    }, []); 

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const isCourierActive = [OrderStatus.PICKUP, OrderStatus.DELIVERY].includes(order.status);
        
        // Always clean up previous interval
        if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
            animationIntervalRef.current = null;
        }

        if (!isCourierActive && courierMarkerRef.current) {
            courierMarkerRef.current.remove();
            courierMarkerRef.current = null;
        }

        if (isCourierActive) {
            const truckSvgIcon = `
                <div class="relative flex items-center justify-center">
                    <div class="absolute w-10 h-10 bg-brand-success/30 rounded-full animate-ping"></div>
                    <div class="relative p-2 bg-brand-success rounded-full shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-white">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 013.375-3.375h9.75a3.375 3.375 0 013.375 3.375v1.875M16.5 12h-9m9 0a1.5 1.5 0 01-1.5 1.5h-6a1.5 1.5 0 01-1.5-1.5m9 0a1.5 1.5 0 00-1.5-1.5h-6a1.5 1.5 0 00-1.5 1.5m9 0V9A1.5 1.5 0 0015 7.5h-6A1.5 1.5 0 007.5 9v3m9 0h3.375c.621 0 1.125.504 1.125 1.125v1.875" />
                        </svg>
                    </div>
                </div>
            `;
            const truckIcon = L.divIcon({
                html: truckSvgIcon,
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });

            const courierStartLatLng = order.status === OrderStatus.PICKUP ? clientLatLng : partnerLatLng;
            const courierEndLatLng = order.status === OrderStatus.PICKUP ? partnerLatLng : clientLatLng;
            
            if (!courierMarkerRef.current) {
                courierMarkerRef.current = L.marker(courierStartLatLng, { icon: truckIcon }).addTo(map);
            } else {
                courierMarkerRef.current.setLatLng(courierStartLatLng);
            }
            
            const duration = 20000; // 20 seconds simulation
            const intervalTime = 100;
            const steps = duration / intervalTime;
            let step = 0;

            animationIntervalRef.current = window.setInterval(() => {
                step++;
                const progress = Math.min(step / steps, 1);
                
                const newLat = courierStartLatLng[0] + (courierEndLatLng[0] - courierStartLatLng[0]) * progress;
                const newLng = courierStartLatLng[1] + (courierEndLatLng[1] - courierStartLatLng[1]) * progress;
                
                if (courierMarkerRef.current) {
                    courierMarkerRef.current.setLatLng([newLat, newLng]);
                }

                if (progress >= 1) {
                    if (animationIntervalRef.current) {
                       clearInterval(animationIntervalRef.current);
                       animationIntervalRef.current = null;
                    }
                }
            }, intervalTime);
        }
        
        return () => {
            if (animationIntervalRef.current) {
                clearInterval(animationIntervalRef.current);
            }
        };
    }, [order.status, clientLatLng, partnerLatLng]);


    return (
        <div ref={mapContainerRef} className="relative w-full h-[400px] bg-slate-200 rounded-lg overflow-hidden z-10">
            {/* Leaflet map is rendered here */}
        </div>
    );
};