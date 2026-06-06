
import React from 'react';
import { 
    Order, User, Partner, PartnerApplication, ApplicationStatus, PartnerType, ServiceType, OrderStatus, Review, 
    AppNotification, PromoCode, Service, SiteContent, SupportTicket, TicketStatus, TicketMessage, Chat, ChatMessage, 
    LogisticsPartner, LoyaltySettings, ReferralSettings, NotificationPreferences, NotificationType, Advertisement, HowItWorksStep, FAQItem, PartnerFeatures, 
    ApplicationSettings, Article, OptimizedRoute, RouteMission, DrcAddress,
    UserRole, TeamMemberRole, WebhookEvent, AutomationSettings, TrackingSettings, SubscriptionPlan, Invoice, CommissionSettings, RefundRequest, RefundReason, RefundStatus, SecurityAlert, CreateOrderRequest,
    LoginRequest, RegisterRequest, NotificationAnalytic, BulkNotificationTarget, AdminPermissions, AdminSection, InventoryItem, DeliverySettings,
    ActivityLog, TicketCategory,
    BackendUser,
    BackendPartner,
    BackendOrder,
    WorkingHours
} from './types';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { sendTransactionalEmail } from './services/emailService';
import { WelcomeEmail } from './components/emails/WelcomeEmail';
import { NewPartnerWelcomeEmail } from './components/emails/NewPartnerWelcomeEmail';
import { NewLogisticsPartnerWelcomeEmail } from './components/emails/NewLogisticsPartnerWelcomeEmail';
import { appEvents } from './utils/events';
import { ResponseSanitizer } from './backend/utils/sanitize';


// ====================================================================================
// CONSTANTS
// ====================================================================================

export const EXCHANGE_RATES = {
  USD: 1,
  CDF: 2800,
};

// ====================================================================================
// MOCK DATABASE & HELPERS
// ====================================================================================

export const DB = {
    _data: {} as any,
    _isInitialized: false,

    _initialize: function() {
        if (this._isInitialized) return;
        
        try {
            const storedData = localStorage.getItem('laundry-app-db');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                // Force merge initial data for sections that might be empty or missing in old storage
                const sectionsToForce = ['advertisements', 'partners', 'services', 'siteContent', 'users', 'orderHistory', 'reviews', 'appNotifications', 'promoCodes'];
                sectionsToForce.forEach(key => {
                    if (!parsed[key] || (Array.isArray(parsed[key]) && parsed[key].length === 0)) {
                        parsed[key] = JSON.parse(JSON.stringify(initialDBData[key as keyof typeof initialDBData]));
                    }
                });
                this._data = parsed;
            } else {
                this._data = JSON.parse(JSON.stringify(initialDBData));
                this.save();
            }
        } catch (e) {
            console.error("Failed to initialize DB from localStorage, using initial data.", e);
            this._data = JSON.parse(JSON.stringify(initialDBData));
        }
        this._isInitialized = true;
    },

    get: function(key: string) {
        this._initialize();
        return JSON.parse(JSON.stringify(this._data[key] || []));
    },

    set: function(key: string, value: any) {
        this._initialize();
        this._data[key] = value;
        this.save();
        appEvents.emit('data_changed');
    },
    
    save: function() {
        try {
            localStorage.setItem('laundry-app-db', JSON.stringify(this._data));
        } catch (e) {
            console.error("Failed to save DB to localStorage.", e);
        }
    },

    addItem: function(key: string, item: any) {
        this._initialize();
        const collection = this.get(key);
        collection.push(item);
        this.set(key, collection);
    },

    updateItem: function(key: string, itemId: string, updates: any) {
        this._initialize();
        const collection = this.get(key);
        const itemIndex = collection.findIndex((i: any) => i.id === itemId);
        if (itemIndex > -1) {
            collection[itemIndex] = { ...collection[itemIndex], ...updates };
            this.set(key, collection);
            return collection[itemIndex];
        }
        return null;
    },

    deleteItem: function(key: string, itemId: string) {
        this._initialize();
        let collection = this.get(key);
        collection = collection.filter((i: any) => i.id !== itemId);
        this.set(key, collection);
    }
};

const defaultWorkingHours: WorkingHours = {
    monday: { open: '08:00', close: '19:00', isClosed: false },
    tuesday: { open: '08:00', close: '19:00', isClosed: false },
    wednesday: { open: '08:00', close: '19:00', isClosed: false },
    thursday: { open: '08:00', close: '19:00', isClosed: false },
    friday: { open: '08:00', close: '19:00', isClosed: false },
    saturday: { open: '09:00', close: '17:00', isClosed: false },
    sunday: { open: '09:00', close: '13:00', isClosed: true },
};

const initialDBData = {
    users: [
        { id: 'USER-1', name: 'John Doe', email: 'john.doe@example.com', phone: '0812345678', passwordHash: 'password123', role: 'customer', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' }, loyaltyPoints: 1250, referralCode: 'LE-X7K9M2BQ', createdAt: '2023-01-15T10:00:00Z', is2FAEnabled: false, notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true }, isEmailValid: true },
        { id: 'USER-ADMIN', name: 'Admin User', email: 'admin@laundry.app', phone: '0810000000', passwordHash: 'adminpass123', role: 'superadmin', pickupAddress: { commune: 'System', avenue: 'Admin', numero: '1' }, loyaltyPoints: 0, referralCode: 'LE-A3D8F1GH', createdAt: '2023-01-01T00:00:00Z', is2FAEnabled: true, notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true }, isEmailValid: true },
        { id: 'USER-PARTNER-1', name: 'Patrice Manager', email: 'patrice@prestige.com', phone: '0820000001', passwordHash: 'partnerpass123', role: 'partner-owner', partnerId: 'PARTNER-1', pickupAddress: { commune: 'Gombe', avenue: 'Du 30 Juin', numero: '10' }, loyaltyPoints: 0, referralCode: 'LE-P4R7T9WC', createdAt: '2023-01-10T09:00:00Z', is2FAEnabled: false, notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true }, isEmailValid: true },
        { id: 'USER-DRIVER-1', name: 'Driver Kabila', email: 'driver1@kinexpress.cd', phone: '0831111111', passwordHash: 'driverpass123', role: 'driver', partnerId: 'LOGISTICS-1', pickupAddress: { commune: 'Lingwala', avenue: 'Des Pilotes', numero: '7' }, loyaltyPoints: 0, referralCode: 'LE-D1V3R5KM', createdAt: '2023-02-01T08:00:00Z', is2FAEnabled: false, notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: false, general: true }, isEmailValid: true },
        { id: 'USER-DRIVER-2', name: 'Driver Mfumu', email: 'driver2@kinexpress.cd', phone: '0832222222', passwordHash: 'driverpass123', role: 'driver', partnerId: 'LOGISTICS-1', pickupAddress: { commune: 'Kintambo', avenue: 'Makala', numero: '12' }, loyaltyPoints: 0, referralCode: 'LE-M2F6U8NP', createdAt: '2023-03-15T08:00:00Z', is2FAEnabled: false, notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: false, general: true }, isEmailValid: true },
        { id: 'USER-DRIVER-3', name: 'Driver Tshisekedi', email: 'driver3@kinexpress.cd', phone: '0833333333', passwordHash: 'driverpass123', role: 'driver', partnerId: 'LOGISTICS-1', pickupAddress: { commune: 'Ngaliema', avenue: 'de l\'Universite', numero: '55' }, loyaltyPoints: 0, referralCode: 'LE-T3S5K7WD', createdAt: '2023-04-01T08:00:00Z', is2FAEnabled: false, notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: false, general: true }, isEmailValid: true },
        { id: 'USER-002', name: 'Marie Kabongo', email: 'marie.kabongo@example.com', phone: '0844444444', passwordHash: 'mariepass123', role: 'customer', pickupAddress: { commune: 'Ngaliema', avenue: 'de l\'Equateur', numero: '22' }, loyaltyPoints: 340, referralCode: 'LE-M4R8E2KC', createdAt: '2023-06-10T14:00:00Z', is2FAEnabled: false, notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true }, isEmailValid: true },
        { id: 'USER-003', name: 'Jean Mutombo', email: 'jean.mutombo@example.com', phone: '0855555555', passwordHash: 'jeanpass123', role: 'customer', pickupAddress: { commune: 'Limete', avenue: 'Kasavubu', numero: '88' }, loyaltyPoints: 780, referralCode: 'LE-J3A7N4TM', createdAt: '2023-08-20T09:30:00Z', is2FAEnabled: false, notificationPreferences: { newOrder: true, orderStatusChange: false, newChatMessage: true, promotions: true, general: true }, isEmailValid: true },
    ],
    partners: [
        { id: 'PARTNER-1', name: 'Prestige Pressing', slug: 'prestige-pressing', type: PartnerType.PRESSING, rating: 4.8, reviewCount: 152, imageUrls: ['https://images.unsplash.com/photo-1545173153-5dd9215b6f57?w=800&q=80'], address: '123 Av. du 30 Juin, Gombe', coordinates: { lat: -4.316, lng: 15.308 }, serviceIds: ['SERV-PRESSING-STD'], isFeatured: true, enabledFeatures: { promotions: true, financials: true, analytics: true, customDomain: true, customSubdomain: true, teamManagement: true, apiAccess: true, advancedAutomation: true, aiReviewAssistant: true, invoiceGenerator: true }, commissionRate: 0.15, currency: 'USD', workingHours: defaultWorkingHours },
        { id: 'PARTNER-2', name: 'Lavage Express Gombe', slug: 'lavage-express-gombe', type: PartnerType.LAVANDIER, rating: 4.6, reviewCount: 89, imageUrls: ['https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&q=80'], address: '45 Blvd Kasa-Vubu, Gombe', coordinates: { lat: -4.321, lng: 15.312 }, serviceIds: ['SERV-LAUNDRY-STD'], isFeatured: true, enabledFeatures: { promotions: true, financials: true, analytics: true, teamManagement: true, advancedAutomation: true }, commissionRate: 0.12, currency: 'USD', workingHours: defaultWorkingHours },
        { id: 'PARTNER-3', name: 'Clean Chic Pressing', slug: 'clean-chic-pressing', type: PartnerType.PRESSING, rating: 4.9, reviewCount: 210, imageUrls: ['https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?w=800&q=80'], address: '12 Av. de l\'Equateur, Limete', coordinates: { lat: -4.345, lng: 15.331 }, serviceIds: ['SERV-PRESSING-STD'], isFeatured: true, enabledFeatures: { promotions: true, analytics: true, customSubdomain: true }, commissionRate: 0.15, currency: 'USD', workingHours: defaultWorkingHours },
        { id: 'PARTNER-4', name: 'Rapido Lavage', slug: 'rapido-lavage', type: PartnerType.LAVANDIER, rating: 4.4, reviewCount: 67, imageUrls: ['https://images.unsplash.com/photo-1489274495757-95c7c1364643?w=800&q=80'], address: 'Bandal Nord, Kinshasa', coordinates: { lat: -4.338, lng: 15.289 }, serviceIds: ['SERV-LAUNDRY-STD'], isFeatured: true, enabledFeatures: { promotions: true, advancedAutomation: true }, commissionRate: 0.10, currency: 'USD', workingHours: defaultWorkingHours },
    ],
    services: [
        { id: 'SERV-PRESSING-STD', type: ServiceType.PRESSING, title: 'Nettoyage à sec standard', description: 'Nettoyage professionnel pour vos vêtements délicats.', iconName: 'shirt', imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&q=80', priceModel: 'per_item', articleCategories: [{name: 'Général', items: [{id:'ART-CHEMISE', name: 'Chemise', price: 2.5, description: 'Chemise homme ou femme'}, {id:'ART-PANTALON', name: 'Pantalon', price: 3.5, description: 'Pantalon classique'}]}] },
        { id: 'SERV-LAUNDRY-STD', type: ServiceType.BLANCHISSERIE, title: 'Lavage & Pliage', description: 'Lavage complet, séchage et pliage de vos vêtements quotidiens.', iconName: 'wash', imageUrl: 'https://images.unsplash.com/photo-1545173153-5dd9215b6f57?w=400&q=80', priceModel: 'per_kg', price: 1.5 },
        { id: 'SERV-CORDONNERIE-STD', type: ServiceType.CORDONNERIE, title: 'Cordonnerie', description: 'Réparation et entretien de vos chaussures et articles en cuir.', iconName: 'sparkles', imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80', priceModel: 'per_item', articleCategories: [{name: 'Général', items: [{id:'ART-TALON', name: 'Réparation Talon', price: 10, description: 'Réparation de talon usé'}, {id:'ART-CIRAGE', name: 'Cirage Complet', price: 5, description: 'Nettoyage et cirage professionnel'}]}] },
    ],
    orderHistory: [
        { id: 'ORDER-001', userId: 'USER-1', partner: { id: 'PARTNER-1', name: 'Prestige Pressing', slug: 'prestige-pressing', type: PartnerType.PRESSING, rating: 4.8, reviewCount: 152, imageUrls: [], address: '123 Av. du 30 Juin, Gombe', coordinates: { lat: -4.316, lng: 15.308 }, serviceIds: ['SERV-PRESSING-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.15, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-PRESSING-STD', type: ServiceType.PRESSING, title: 'Nettoyage à sec standard', description: '', iconName: 'shirt', imageUrl: '', priceModel: 'per_item', articleCategories: [] }, items: [{ article: { id: 'ART-CHEMISE', name: 'Chemise', price: 2.5 }, quantity: 3 }, { article: { id: 'ART-PANTALON', name: 'Pantalon', price: 3.5 }, quantity: 2 }] }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-05-10T09:00:00Z', status: OrderStatus.COMPLETED, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-05-10T08:30:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-05-10T08:45:00Z' }, { status: OrderStatus.READY_FOR_PICKUP, time: '2024-05-10T09:00:00Z' }, { status: OrderStatus.PICKUP, time: '2024-05-10T09:30:00Z' }, { status: OrderStatus.PROCESSING, time: '2024-05-10T10:00:00Z' }, { status: OrderStatus.READY_FOR_DELIVERY, time: '2024-05-10T14:00:00Z' }, { status: OrderStatus.DELIVERY, time: '2024-05-10T15:30:00Z' }, { status: OrderStatus.COMPLETED, time: '2024-05-10T16:00:00Z' }], totalPrice: 14.5, createdAt: '2024-05-10T08:30:00Z', isReviewed: true, driverId: 'USER-DRIVER-1', logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'paid', amountPaid: 14.5, backendOrderNumber: 'LE-2024-0001' },
        { id: 'ORDER-002', userId: 'USER-1', partner: { id: 'PARTNER-2', name: 'Lavage Express Gombe', slug: 'lavage-express-gombe', type: PartnerType.LAVANDIER, rating: 4.6, reviewCount: 89, imageUrls: [], address: '45 Blvd Kasa-Vubu, Gombe', coordinates: { lat: -4.321, lng: 15.312 }, serviceIds: ['SERV-LAUNDRY-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.12, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-LAUNDRY-STD', type: ServiceType.BLANCHISSERIE, title: 'Lavage & Pliage', description: '', iconName: 'wash', imageUrl: '', priceModel: 'per_kg', price: 1.5 }, weight: 5.2 }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-05-15T10:00:00Z', status: OrderStatus.COMPLETED, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-05-15T09:45:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-05-15T10:00:00Z' }, { status: OrderStatus.PICKUP, time: '2024-05-15T10:30:00Z' }, { status: OrderStatus.PROCESSING, time: '2024-05-15T11:00:00Z' }, { status: OrderStatus.READY_FOR_DELIVERY, time: '2024-05-15T16:00:00Z' }, { status: OrderStatus.COMPLETED, time: '2024-05-15T17:00:00Z' }], totalPrice: 7.8, createdAt: '2024-05-15T09:45:00Z', isReviewed: true, driverId: 'USER-DRIVER-2', logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'paid', amountPaid: 7.8, backendOrderNumber: 'LE-2024-0002' },
        { id: 'ORDER-003', userId: 'USER-1', partner: { id: 'PARTNER-3', name: 'Clean Chic Pressing', slug: 'clean-chic-pressing', type: PartnerType.PRESSING, rating: 4.9, reviewCount: 210, imageUrls: [], address: '12 Av. de l\'Equateur, Limete', coordinates: { lat: -4.345, lng: 15.331 }, serviceIds: ['SERV-PRESSING-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.15, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-PRESSING-STD', type: ServiceType.PRESSING, title: 'Nettoyage à sec standard', description: '', iconName: 'shirt', imageUrl: '', priceModel: 'per_item', articleCategories: [] }, items: [{ article: { id: 'ART-CHEMISE', name: 'Chemise', price: 2.5 }, quantity: 5 }] }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-05-20T14:00:00Z', status: OrderStatus.COMPLETED, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-05-20T13:30:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-05-20T13:45:00Z' }, { status: OrderStatus.PICKUP, time: '2024-05-20T14:15:00Z' }, { status: OrderStatus.PROCESSING, time: '2024-05-20T15:00:00Z' }, { status: OrderStatus.READY_FOR_DELIVERY, time: '2024-05-20T19:00:00Z' }, { status: OrderStatus.DELIVERY, time: '2024-05-20T19:30:00Z' }, { status: OrderStatus.COMPLETED, time: '2024-05-20T20:00:00Z' }], totalPrice: 12.5, createdAt: '2024-05-20T13:30:00Z', isReviewed: true, driverId: 'USER-DRIVER-1', logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'paid', amountPaid: 12.5, backendOrderNumber: 'LE-2024-0003' },
        { id: 'ORDER-004', userId: 'USER-1', partner: { id: 'PARTNER-1', name: 'Prestige Pressing', slug: 'prestige-pressing', type: PartnerType.PRESSING, rating: 4.8, reviewCount: 152, imageUrls: [], address: '123 Av. du 30 Juin, Gombe', coordinates: { lat: -4.316, lng: 15.308 }, serviceIds: ['SERV-PRESSING-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.15, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-PRESSING-STD', type: ServiceType.PRESSING, title: 'Nettoyage à sec standard', description: '', iconName: 'shirt', imageUrl: '', priceModel: 'per_item', articleCategories: [] }, items: [{ article: { id: 'ART-PANTALON', name: 'Pantalon', price: 3.5 }, quantity: 2 }] }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-06-01T08:00:00Z', status: OrderStatus.DELIVERY, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-06-01T07:30:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-06-01T07:45:00Z' }, { status: OrderStatus.PICKUP, time: '2024-06-01T08:15:00Z' }, { status: OrderStatus.PROCESSING, time: '2024-06-01T09:00:00Z' }, { status: OrderStatus.READY_FOR_DELIVERY, time: '2024-06-01T13:00:00Z' }, { status: OrderStatus.DELIVERY, time: '2024-06-01T13:30:00Z' }], totalPrice: 7.0, createdAt: '2024-06-01T07:30:00Z', isReviewed: false, driverId: 'USER-DRIVER-2', logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'pending', amountPaid: 0, backendOrderNumber: 'LE-2024-0004' },
        { id: 'ORDER-005', userId: 'USER-1', partner: { id: 'PARTNER-4', name: 'Rapido Lavage', slug: 'rapido-lavage', type: PartnerType.LAVANDIER, rating: 4.4, reviewCount: 67, imageUrls: [], address: 'Bandal Nord, Kinshasa', coordinates: { lat: -4.338, lng: 15.289 }, serviceIds: ['SERV-LAUNDRY-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.10, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-LAUNDRY-STD', type: ServiceType.BLANCHISSERIE, title: 'Lavage & Pliage', description: '', iconName: 'wash', imageUrl: '', priceModel: 'per_kg', price: 1.5 }, weight: 8.0 }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-06-02T11:00:00Z', status: OrderStatus.PROCESSING, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-06-02T10:30:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-06-02T10:45:00Z' }, { status: OrderStatus.PICKUP, time: '2024-06-02T11:15:00Z' }, { status: OrderStatus.PROCESSING, time: '2024-06-02T12:00:00Z' }], totalPrice: 12.0, createdAt: '2024-06-02T10:30:00Z', isReviewed: false, driverId: 'USER-DRIVER-3', logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'pending', amountPaid: 0, backendOrderNumber: 'LE-2024-0005' },
        { id: 'ORDER-006', userId: 'USER-1', partner: { id: 'PARTNER-2', name: 'Lavage Express Gombe', slug: 'lavage-express-gombe', type: PartnerType.LAVANDIER, rating: 4.6, reviewCount: 89, imageUrls: [], address: '45 Blvd Kasa-Vubu, Gombe', coordinates: { lat: -4.321, lng: 15.312 }, serviceIds: ['SERV-LAUNDRY-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.12, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-LAUNDRY-STD', type: ServiceType.BLANCHISSERIE, title: 'Lavage & Pliage', description: '', iconName: 'wash', imageUrl: '', priceModel: 'per_kg', price: 1.5 }, weight: 3.5 }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-06-03T09:00:00Z', status: OrderStatus.READY_FOR_PICKUP, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-06-03T08:45:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-06-03T09:00:00Z' }, { status: OrderStatus.READY_FOR_PICKUP, time: '2024-06-03T09:15:00Z' }], totalPrice: 5.25, createdAt: '2024-06-03T08:45:00Z', isReviewed: false, logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'pending', amountPaid: 0, backendOrderNumber: 'LE-2024-0006' },
        { id: 'ORDER-007', userId: 'USER-1', partner: { id: 'PARTNER-1', name: 'Prestige Pressing', slug: 'prestige-pressing', type: PartnerType.PRESSING, rating: 4.8, reviewCount: 152, imageUrls: [], address: '123 Av. du 30 Juin, Gombe', coordinates: { lat: -4.316, lng: 15.308 }, serviceIds: ['SERV-PRESSING-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.15, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-PRESSING-STD', type: ServiceType.PRESSING, title: 'Nettoyage à sec standard', description: '', iconName: 'shirt', imageUrl: '', priceModel: 'per_item', articleCategories: [] }, items: [{ article: { id: 'ART-CHEMISE', name: 'Chemise', price: 2.5 }, quantity: 2 }, { article: { id: 'ART-PANTALON', name: 'Pantalon', price: 3.5 }, quantity: 1 }] }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-06-04T10:00:00Z', status: OrderStatus.AWAITING_CONFIRMATION, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-06-04T09:30:00Z' }], totalPrice: 8.5, createdAt: '2024-06-04T09:30:00Z', isReviewed: false, logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'pending', amountPaid: 0, backendOrderNumber: 'LE-2024-0007' },
        { id: 'ORDER-008', userId: 'USER-1', partner: { id: 'PARTNER-3', name: 'Clean Chic Pressing', slug: 'clean-chic-pressing', type: PartnerType.PRESSING, rating: 4.9, reviewCount: 210, imageUrls: [], address: '12 Av. de l\'Equateur, Limete', coordinates: { lat: -4.345, lng: 15.331 }, serviceIds: ['SERV-PRESSING-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.15, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-PRESSING-STD', type: ServiceType.PRESSING, title: 'Nettoyage à sec standard', description: '', iconName: 'shirt', imageUrl: '', priceModel: 'per_item', articleCategories: [] }, items: [{ article: { id: 'ART-CHEMISE', name: 'Chemise', price: 2.5 }, quantity: 4 }] }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-05-25T09:00:00Z', status: OrderStatus.COMPLETED, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-05-25T08:30:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-05-25T08:45:00Z' }, { status: OrderStatus.PICKUP, time: '2024-05-25T09:15:00Z' }, { status: OrderStatus.PROCESSING, time: '2024-05-25T10:00:00Z' }, { status: OrderStatus.READY_FOR_DELIVERY, time: '2024-05-25T15:00:00Z' }, { status: OrderStatus.COMPLETED, time: '2024-05-25T16:00:00Z' }], totalPrice: 10.0, createdAt: '2024-05-25T08:30:00Z', isReviewed: true, driverId: 'USER-DRIVER-1', logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'paid', amountPaid: 10.0, backendOrderNumber: 'LE-2024-0008' },
        { id: 'ORDER-009', userId: 'USER-1', partner: { id: 'PARTNER-1', name: 'Prestige Pressing', slug: 'prestige-pressing', type: PartnerType.PRESSING, rating: 4.8, reviewCount: 152, imageUrls: [], address: '123 Av. du 30 Juin, Gombe', coordinates: { lat: -4.316, lng: 15.308 }, serviceIds: ['SERV-PRESSING-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.15, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-PRESSING-STD', type: ServiceType.PRESSING, title: 'Nettoyage à sec standard', description: '', iconName: 'shirt', imageUrl: '', priceModel: 'per_item', articleCategories: [] }, items: [{ article: { id: 'ART-CHEMISE', name: 'Chemise', price: 2.5 }, quantity: 6 }, { article: { id: 'ART-PANTALON', name: 'Pantalon', price: 3.5 }, quantity: 2 }] }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-05-28T08:00:00Z', status: OrderStatus.COMPLETED, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-05-28T07:30:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-05-28T07:45:00Z' }, { status: OrderStatus.PICKUP, time: '2024-05-28T08:15:00Z' }, { status: OrderStatus.PROCESSING, time: '2024-05-28T09:00:00Z' }, { status: OrderStatus.READY_FOR_DELIVERY, time: '2024-05-28T14:00:00Z' }, { status: OrderStatus.COMPLETED, time: '2024-05-28T15:00:00Z' }], totalPrice: 22.0, createdAt: '2024-05-28T07:30:00Z', isReviewed: true, driverId: 'USER-DRIVER-2', logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'paid', amountPaid: 22.0, backendOrderNumber: 'LE-2024-0009' },
        { id: 'ORDER-010', userId: 'USER-1', partner: { id: 'PARTNER-2', name: 'Lavage Express Gombe', slug: 'lavage-express-gombe', type: PartnerType.LAVANDIER, rating: 4.6, reviewCount: 89, imageUrls: [], address: '45 Blvd Kasa-Vubu, Gombe', coordinates: { lat: -4.321, lng: 15.312 }, serviceIds: ['SERV-LAUNDRY-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.12, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-LAUNDRY-STD', type: ServiceType.BLANCHISSERIE, title: 'Lavage & Pliage', description: '', iconName: 'wash', imageUrl: '', priceModel: 'per_kg', price: 1.5 }, weight: 6.5 }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-06-05T14:00:00Z', status: OrderStatus.COMPLETED, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-06-05T13:30:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-06-05T13:45:00Z' }, { status: OrderStatus.PICKUP, time: '2024-06-05T14:15:00Z' }, { status: OrderStatus.PROCESSING, time: '2024-06-05T15:00:00Z' }, { status: OrderStatus.READY_FOR_DELIVERY, time: '2024-06-05T18:00:00Z' }, { status: OrderStatus.COMPLETED, time: '2024-06-05T19:00:00Z' }], totalPrice: 9.75, createdAt: '2024-06-05T13:30:00Z', isReviewed: true, driverId: 'USER-DRIVER-3', logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'paid', amountPaid: 9.75, backendOrderNumber: 'LE-2024-0010' },
        { id: 'ORDER-011', userId: 'USER-1', partner: { id: 'PARTNER-4', name: 'Rapido Lavage', slug: 'rapido-lavage', type: PartnerType.LAVANDIER, rating: 4.4, reviewCount: 67, imageUrls: [], address: 'Bandal Nord, Kinshasa', coordinates: { lat: -4.338, lng: 15.289 }, serviceIds: ['SERV-LAUNDRY-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.10, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-LAUNDRY-STD', type: ServiceType.BLANCHISSERIE, title: 'Lavage & Pliage', description: '', iconName: 'wash', imageUrl: '', priceModel: 'per_kg', price: 1.5 }, weight: 4.0 }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-06-06T09:00:00Z', status: OrderStatus.REJECTED, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-06-06T08:30:00Z' }, { status: OrderStatus.REJECTED, time: '2024-06-06T08:45:00Z' }], totalPrice: 6.0, createdAt: '2024-06-06T08:30:00Z', isReviewed: false, rejectionReason: 'Indisponible ce jour-la', backendOrderNumber: 'LE-2024-0011' },
        { id: 'ORDER-012', userId: 'USER-1', partner: { id: 'PARTNER-1', name: 'Prestige Pressing', slug: 'prestige-pressing', type: PartnerType.PRESSING, rating: 4.8, reviewCount: 152, imageUrls: [], address: '123 Av. du 30 Juin, Gombe', coordinates: { lat: -4.316, lng: 15.308 }, serviceIds: ['SERV-PRESSING-STD'], isFeatured: true, enabledFeatures: {}, commissionRate: 0.15, currency: 'USD', workingHours: defaultWorkingHours }, serviceItems: [{ service: { id: 'SERV-PRESSING-STD', type: ServiceType.PRESSING, title: 'Nettoyage à sec standard', description: '', iconName: 'shirt', imageUrl: '', priceModel: 'per_item', articleCategories: [] }, items: [{ article: { id: 'ART-CHEMISE', name: 'Chemise', price: 2.5 }, quantity: 10 }] }], clientDetails: { name: 'John Doe', phone: '0812345678', pickupAddress: { commune: 'Gombe', avenue: 'Des Aviateurs', numero: '123' } }, pickupTime: '2024-06-07T08:00:00Z', status: OrderStatus.DELAYED, trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: '2024-06-07T07:30:00Z' }, { status: OrderStatus.CONFIRMED, time: '2024-06-07T07:45:00Z' }, { status: OrderStatus.PICKUP, time: '2024-06-07T08:15:00Z' }, { status: OrderStatus.PROCESSING, time: '2024-06-07T09:00:00Z' }, { status: OrderStatus.DELAYED, time: '2024-06-07T18:00:00Z' }], totalPrice: 25.0, createdAt: '2024-06-07T07:30:00Z', isReviewed: false, driverId: 'USER-DRIVER-1', logisticsPartnerId: 'LOGISTICS-1', paymentStatus: 'pending', amountPaid: 0, backendOrderNumber: 'LE-2024-0012' },
    ],
    reviews: [
        { id: 'REVIEW-001', orderId: 'ORDER-001', userId: 'USER-1', partnerId: 'PARTNER-1', rating: 5, comment: 'Service impeccable ! Mes chemises sont parfaitement repassees et le livreur etait ponctuel. Je recommande vivement Prestige Pressing.', createdAt: '2024-05-10T16:30:00Z', reply: 'Merci beaucoup John ! Nous sommes ravis que vous soyez satisfait. A tres bientot.' },
        { id: 'REVIEW-002', orderId: 'ORDER-002', userId: 'USER-1', partnerId: 'PARTNER-2', rating: 4, comment: 'Bon lavage, mais le delai etait un peu long compare a ce qui etait annonce. Sinon qualite correcte.', createdAt: '2024-05-15T17:30:00Z' },
        { id: 'REVIEW-003', orderId: 'ORDER-003', userId: 'USER-1', partnerId: 'PARTNER-3', rating: 5, comment: 'Excellente experience avec Clean Chic. Le costume est comme neuf, emballage soigne et livraison rapide. Merci !', createdAt: '2024-05-20T20:30:00Z' },
        { id: 'REVIEW-004', orderId: 'ORDER-008', userId: 'USER-1', partnerId: 'PARTNER-3', rating: 4, comment: 'Tres bon pressing, tarifs un peu eleves mais la qualite est au rendez-vous.', createdAt: '2024-05-25T16:30:00Z' },
        { id: 'REVIEW-005', orderId: 'ORDER-009', userId: 'USER-1', partnerId: 'PARTNER-1', rating: 5, comment: 'Encore une fois parfait ! J\'ai pris leur service express cette fois, livre en 6h. Incroyable.', createdAt: '2024-05-28T15:30:00Z', reply: 'C\'est un plaisir John ! L\'option express est faite pour ca.' },
        { id: 'REVIEW-006', orderId: 'ORDER-010', userId: 'USER-1', partnerId: 'PARTNER-2', rating: 4, comment: 'Lavage propre et bien plie. Rien a redire, je repasserai commande.', createdAt: '2024-06-05T19:30:00Z' },
    ],
    partnerApplications: [
        { id: 'APP-001', companyName: 'Bling Blanchisserie', partnerType: PartnerType.LAVANDIER, contactName: 'Marie Kabongo', phone: '0811122233', email: 'marie@bling.cd', address: '12 Av. de la Paix, Ngaliema', status: ApplicationStatus.PENDING, submittedAt: '2024-05-15T10:00:00Z', message: 'Nous souhaitons rejoindre le reseau pour offrir nos services de lavage ecologique.' },
        { id: 'APP-002', companyName: 'Elegance Pressing', partnerType: PartnerType.PRESSING, contactName: 'Jean-Pierre Mutombo', phone: '0822334455', email: 'jp@elegance.cd', address: '45 Blvd du 30 Juin, Gombe', status: ApplicationStatus.APPROVED, submittedAt: '2024-04-20T08:00:00Z' },
        { id: 'APP-003', companyName: 'Quick Wash Bandal', partnerType: PartnerType.LAVANDIER, contactName: 'Sylvie Mbuyi', phone: '0833445566', email: 'sylvie@quickwash.cd', address: '78 Av. Kimbuta, Bandal', status: ApplicationStatus.REJECTED, submittedAt: '2024-05-01T14:00:00Z', rejectionReason: 'Documents incomplets et adresse non verifiable.' },
    ],
    supportTickets: [
        { id: 'TICKET-001', userId: 'USER-1', userName: 'John Doe', orderId: 'ORDER-012', subject: 'Commande en retard', messages: [{ id: 'MSG-001', authorId: 'USER-1', authorName: 'John Doe', message: 'Ma commande LE-2024-0012 etait prevue pour aujourd\'hui 18h et je n\'ai toujours rien recu. Pouvez-vous verifier ?', createdAt: '2024-06-07T19:00:00Z' }, { id: 'MSG-002', authorId: 'USER-ADMIN', authorName: 'Support Laundry', message: 'Bonjour John, nous avons contacte le partenaire. Un probleme technique a retarde le traitement. Votre commande sera livree demain matin avec une remise de 20%.', createdAt: '2024-06-07T19:30:00Z' }], status: TicketStatus.IN_PROGRESS, createdAt: '2024-06-07T19:00:00Z', updatedAt: '2024-06-07T19:30:00Z', category: TicketCategory.DELIVERY_ISSUE },
        { id: 'TICKET-002', userId: 'USER-1', userName: 'John Doe', subject: 'Question sur le programme de fidelite', messages: [{ id: 'MSG-003', authorId: 'USER-1', authorName: 'John Doe', message: 'Comment puis-je utiliser mes points de fidelite ? J\'en ai 1250.', createdAt: '2024-05-20T10:00:00Z' }, { id: 'MSG-004', authorId: 'USER-ADMIN', authorName: 'Support Laundry', message: 'Bonjour John, vous pouvez convertir 100 points en 1$ de reduction lors du paiement. Vos 1250 points valent donc 12.50$ !', createdAt: '2024-05-20T10:30:00Z' }], status: TicketStatus.CLOSED, createdAt: '2024-05-20T10:00:00Z', updatedAt: '2024-05-20T10:30:00Z', category: TicketCategory.ACCOUNT_HELP },
        { id: 'TICKET-003', userId: 'USER-PARTNER-1', userName: 'Patrice Manager', subject: 'Probleme de paiement commission', messages: [{ id: 'MSG-005', authorId: 'USER-PARTNER-1', authorName: 'Patrice Manager', message: 'Je n\'ai pas recu mon virement cette semaine. Pouvez-vous verifier ?', createdAt: '2024-06-01T09:00:00Z' }], status: TicketStatus.OPEN, createdAt: '2024-06-01T09:00:00Z', updatedAt: '2024-06-01T09:00:00Z', category: TicketCategory.BILLING },
    ],
    chats: [
        { id: 'CHAT-001', orderId: 'ORDER-001', participants: ['USER-1', 'USER-PARTNER-1'], messages: [{ id: 'CHATMSG-001', authorId: 'USER-1', authorName: 'John Doe', message: 'Bonjour, pouvez-vous repasser mes chemises avec amidon ?', createdAt: '2024-05-10T09:00:00Z' }, { id: 'CHATMSG-002', authorId: 'USER-PARTNER-1', authorName: 'Patrice Manager', message: 'Bonjour John, bien sur ! Nous allons prendre en compte votre demande.', createdAt: '2024-05-10T09:05:00Z' }, { id: 'CHATMSG-003', authorId: 'USER-1', authorName: 'John Doe', message: 'Parfait, merci beaucoup.', createdAt: '2024-05-10T09:06:00Z' }] },
        { id: 'CHAT-002', orderId: 'ORDER-004', participants: ['USER-1', 'USER-DRIVER-2'], messages: [{ id: 'CHATMSG-004', authorId: 'USER-1', authorName: 'John Doe', message: 'Je suis au bureau, 3eme etage. Merci.', createdAt: '2024-06-01T13:00:00Z' }, { id: 'CHATMSG-005', authorId: 'USER-DRIVER-2', authorName: 'Driver Kabila', message: 'J\'arrive dans 5 minutes. Je monte.', createdAt: '2024-06-01T13:02:00Z' }] },
    ],
    promoCodes: [
        { id: 'PROMO-001', code: 'WELCOME20', discountType: 'percentage', discountValue: 20, minOrderValue: 10, isForNewUsersOnly: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', usageCount: 45, maxUsage: 100, usageLimitPerCustomer: 1, description: '20% de reduction sur la premiere commande', startDate: '2024-01-01', endDate: '2024-12-31' },
        { id: 'PROMO-002', code: 'FIDELITE10', discountType: 'percentage', discountValue: 10, minOrderValue: 15, isForNewUsersOnly: false, isActive: true, createdAt: '2024-03-01T00:00:00Z', usageCount: 128, maxUsage: null, usageLimitPerCustomer: null, description: '10% de reduction pour les clients fideles', startDate: '2024-03-01', endDate: null },
        { id: 'PROMO-003', code: 'LIVGRATUITE', discountType: 'fixed', discountValue: 2, minOrderValue: 20, isForNewUsersOnly: false, isActive: true, createdAt: '2024-04-01T00:00:00Z', usageCount: 67, maxUsage: 200, usageLimitPerCustomer: 2, description: '2$ offerts sur les frais de livraison', startDate: '2024-04-01', endDate: '2024-06-30' },
        { id: 'PROMO-004', code: 'EXPRESS15', discountType: 'percentage', discountValue: 15, minOrderValue: 25, isForNewUsersOnly: false, isActive: true, createdAt: '2024-05-01T00:00:00Z', usageCount: 12, maxUsage: 50, usageLimitPerCustomer: 1, description: '15% sur le service express', startDate: '2024-05-01', endDate: '2024-07-31', applicableServices: ['SERV-PRESSING-STD'] },
    ],
    logisticsPartners: [{ id: 'LOGISTICS-1', name: 'Kin Express Logistics' }],
    loyaltySettings: { isEnabled: true, pointsPerDollar: 10, pointsToDollar: 100 },
    referralSettings: { isEnabled: true, referrerBonusPoints: 500, refereeDiscountAmount: 5 },
    appNotifications: [
        { id: 'NOTIF-001', recipientId: 'USER-1', message: 'Votre commande LE-2024-0001 a ete confirmee par Prestige Pressing.', notificationType: NotificationType.ORDER_STATUS_CHANGE, createdAt: '2024-05-10T08:45:00Z', isRead: true, link: { page: 'tracking', params: { orderId: 'ORDER-001' } } },
        { id: 'NOTIF-002', recipientId: 'USER-1', message: 'Votre commande LE-2024-0001 est en cours de livraison. Le chauffeur approche.', notificationType: NotificationType.ORDER_STATUS_CHANGE, createdAt: '2024-05-10T15:30:00Z', isRead: true, link: { page: 'tracking', params: { orderId: 'ORDER-001' } } },
        { id: 'NOTIF-003', recipientId: 'USER-1', message: 'Votre commande LE-2024-0001 est livree avec succes. Laissez un avis !', notificationType: NotificationType.ORDER_STATUS_CHANGE, createdAt: '2024-05-10T16:05:00Z', isRead: false, link: { page: 'tracking', params: { orderId: 'ORDER-001' } } },
        { id: 'NOTIF-004', recipientId: 'USER-1', message: 'Bravo ! Vous avez gagne 145 points de fidelite pour cette commande.', notificationType: NotificationType.PROMOTIONS, createdAt: '2024-05-10T16:10:00Z', isRead: false },
        { id: 'NOTIF-005', recipientId: 'USER-PARTNER-1', message: 'Nouvelle commande LE-2024-0007 en attente de confirmation. 3 chemises + 1 pantalon.', notificationType: NotificationType.NEW_ORDER, createdAt: '2024-06-04T09:30:00Z', isRead: false, actions: [{ label: 'Accepter', actionType: 'ACCEPT_ORDER', payload: { orderId: 'ORDER-007' } }, { label: 'Refuser', actionType: 'REJECT_ORDER', payload: { orderId: 'ORDER-007' } }], link: { page: 'partner-dashboard', params: { orderId: 'ORDER-007' } } },
        { id: 'NOTIF-006', recipientId: 'USER-ADMIN', message: 'Nouvelle candidature partenaire : Bling Blanchisserie (Lavandier, Ngaliema).', notificationType: NotificationType.GENERAL, createdAt: '2024-05-15T10:00:00Z', isRead: false, link: { page: 'admin', params: { section: 'partners' } } },
        { id: 'NOTIF-007', recipientId: 'USER-1', message: 'Offre speciale : 15% sur le service express avec le code EXPRESS15.', notificationType: NotificationType.PROMOTIONS, createdAt: '2024-06-01T08:00:00Z', isRead: true },
        { id: 'NOTIF-008', recipientId: 'USER-DRIVER-1', message: 'Nouvelle mission : ramassage commande ORDER-007 au 123 Av. du 30 Juin, Gombe.', notificationType: NotificationType.NEW_ORDER, createdAt: '2024-06-04T09:30:00Z', isRead: false, link: { page: 'driver-dashboard', params: { orderId: 'ORDER-007' } } },
        { id: 'NOTIF-009', recipientId: 'USER-PARTNER-1', message: 'John Doe vous a envoye un message : "Bonjour, pouvez-vous repasser mes chemises avec amidon ?"', notificationType: NotificationType.NEW_CHAT_MESSAGE, createdAt: '2024-05-10T09:00:00Z', isRead: false, link: { page: 'partner-dashboard', params: { orderId: 'ORDER-001' } } },
    ],
    notificationAnalytics: [
        { notificationId: 'NOTIF-001', event: 'read', timestamp: '2024-05-10T08:50:00Z' },
        { notificationId: 'NOTIF-001', event: 'click', timestamp: '2024-05-10T08:51:00Z' },
        { notificationId: 'NOTIF-003', event: 'read', timestamp: '2024-05-11T10:00:00Z' },
        { notificationId: 'NOTIF-007', event: 'click', timestamp: '2024-06-01T08:05:00Z' },
    ],
    advertisements: [
        { id: 'AD-1', title: 'Offre de Bienvenue', description: 'Profitez de 20% de réduction sur votre première commande avec le code WELCOME20.', imageUrl: 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?w=1200&q=80', linkUrl: '/order', isActive: true, createdAt: '2023-10-01T00:00:00Z' },
        { id: 'AD-2', title: 'Devenez Partenaire', description: 'Rejoignez le réseau n°1 de blanchisserie en RDC et boostez votre chiffre d\'affaires.', imageUrl: 'https://images.unsplash.com/photo-1556740734-7f962f7e0f80?w=1200&q=80', linkUrl: '/become-partner', isActive: true, createdAt: '2023-10-02T00:00:00Z' },
    ],
    applicationSettings: { [PartnerType.PRESSING]: true, [PartnerType.LAVANDIER]: true, [PartnerType.LOGISTICS]: true },
    trackingSettings: { gtmContainerId: 'GTM-XXXXXXX', metaPixelId: '1234567890' },
    commissionSettings: { globalRate: 0.20, byServiceType: { [ServiceType.PRESSING]: 0.25, [ServiceType.BLANCHISSERIE]: 0.18 } },
    siteContent: { 
        hero: { title: 'homePage.hero.title', subtitle: 'homePage.hero.subtitle' }, 
        howItWorksSteps: [
            { id: 'step-1', title: 'homePage.howItWorks.step1.title', description: 'homePage.howItWorks.step1.description', icon: 'shoppingBag' },
            { id: 'step-2', title: 'homePage.howItWorks.step2.title', description: 'homePage.howItWorks.step2.description', icon: 'truck' },
            { id: 'step-3', title: 'homePage.howItWorks.step3.title', description: 'homePage.howItWorks.step3.description', icon: 'sparkles' },
            { id: 'step-4', title: 'homePage.howItWorks.step4.title', description: 'homePage.howItWorks.step4.description', icon: 'home' }
        ], 
        faq: [
            { id: 'q1', question: 'homePage.faq.q1.question', answer: 'homePage.faq.q1.answer' },
            { id: 'q2', question: 'homePage.faq.q2.question', answer: 'homePage.faq.q2.answer' },
            { id: 'q3', question: 'homePage.faq.q3.question', answer: 'homePage.faq.q3.answer' }
        ] 
    },
    subscriptionPlans: [
        { id: 'plan-basic', name: 'Essentiel', description: 'Parfait pour les petits pressings de quartier.', priceMonthly: 29, priceYearly: 290, features: { analytics: true, promotions: true } },
        { id: 'plan-pro', name: 'Professionnel', description: 'Pour les entreprises en pleine croissance.', priceMonthly: 79, priceYearly: 790, isMostPopular: true, features: { analytics: true, promotions: true, customSubdomain: true, teamManagement: true, advancedAutomation: true } },
        { id: 'plan-enterprise', name: 'Entreprise', description: 'Solutions sur mesure pour grands groupes.', priceMonthly: 199, priceYearly: 1990, features: { analytics: true, promotions: true, customSubdomain: true, customDomain: true, teamManagement: true, advancedAutomation: true, apiAccess: true, aiReviewAssistant: true, invoiceGenerator: true } }
    ],
    invoices: [
        { id: 'INV-001', partnerId: 'PARTNER-1', planName: 'Professionnel', amount: 79, date: '2024-05-01T00:00:00Z', status: 'paid', billingCycle: 'monthly' },
        { id: 'INV-002', partnerId: 'PARTNER-2', planName: 'Essentiel', amount: 29, date: '2024-05-01T00:00:00Z', status: 'paid', billingCycle: 'monthly' },
        { id: 'INV-003', partnerId: 'PARTNER-3', planName: 'Professionnel', amount: 79, date: '2024-05-01T00:00:00Z', status: 'overdue', billingCycle: 'monthly' },
    ],
    refundRequests: [
        { id: 'REFUND-001', orderId: 'ORDER-012', userId: 'USER-1', userName: 'John Doe', reason: RefundReason.LATE_DELIVERY, customerComments: 'La commande est en retard de plus de 6h. Je ne peux plus attendre.', requestedAmount: 25.0, status: RefundStatus.PENDING, createdAt: '2024-06-07T19:30:00Z' },
        { id: 'REFUND-002', orderId: 'ORDER-002', userId: 'USER-1', userName: 'John Doe', reason: RefundReason.POOR_QUALITY, customerComments: 'Un de mes pantalons est revenu avec une tache.', requestedAmount: 3.5, status: RefundStatus.APPROVED, createdAt: '2024-05-16T10:00:00Z', resolutionNotes: 'Remboursement approuve. Toutes nos excuses.', resolvedAt: '2024-05-16T14:00:00Z', resolvedBy: 'USER-ADMIN' },
    ],
    activityLogs: [
        { id: 'LOG-001', userId: 'USER-1', userName: 'John Doe', action: 'USER_LOGIN', details: 'Connexion depuis Chrome / Windows', createdAt: '2024-06-04T08:00:00Z' },
        { id: 'LOG-002', userId: 'USER-PARTNER-1', userName: 'Patrice Manager', partnerId: 'PARTNER-1', action: 'PARTNER_PROFILE_UPDATE', details: 'Mise a jour des horaires d\'ouverture', createdAt: '2024-05-20T11:00:00Z' },
        { id: 'LOG-003', userId: 'USER-ADMIN', userName: 'Admin User', action: 'ADMIN_LOGIN', details: 'Connexion au tableau de bord admin', createdAt: '2024-06-04T07:30:00Z' },
        { id: 'LOG-004', userId: 'USER-ADMIN', userName: 'Admin User', action: 'PROMO_CODE_CREATE', details: 'Creation du code EXPRESS15', createdAt: '2024-05-01T09:00:00Z' },
        { id: 'LOG-005', userId: 'USER-ADMIN', userName: 'Admin User', action: 'REFUND_REQUEST_APPROVED', details: 'Remboursement REFUND-002 approuve', createdAt: '2024-05-16T14:00:00Z' },
        { id: 'LOG-006', userId: 'USER-DRIVER-1', userName: 'Driver Kabila', action: 'USER_LOGIN', details: 'Connexion depuis l\'app mobile', createdAt: '2024-06-04T06:00:00Z' },
        { id: 'LOG-007', userId: 'USER-PARTNER-1', userName: 'Patrice Manager', partnerId: 'PARTNER-1', action: 'PARTNER_SERVICE_ADD', details: 'Ajout du service nettoyage cuir', createdAt: '2024-04-15T10:00:00Z' },
        { id: 'LOG-008', userId: 'USER-ADMIN', userName: 'Admin User', action: 'PARTNER_APPLICATION_APPROVED', details: 'Candidature APP-002 approuvee', createdAt: '2024-04-22T08:00:00Z' },
        { id: 'LOG-009', userId: 'USER-1', userName: 'John Doe', action: 'USER_LOGIN_FAILURE', details: 'Tentative de connexion echouee (mot de passe incorrect)', createdAt: '2024-06-03T19:00:00Z' },
        { id: 'LOG-010', userId: 'USER-ADMIN', userName: 'Admin User', action: 'BULK_NOTIFICATION_SENT', details: 'Envoi de 1243 notifications promotionnelles', createdAt: '2024-06-01T08:00:00Z' },
    ],
};


// ====================================================================================
// AI UTILITIES
// ====================================================================================

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

// ====================================================================================
// API FUNCTIONS
// ====================================================================================

const simulateDelay = (delay = 500) => new Promise(resolve => setTimeout(resolve, delay));

export const fetchAllData = async () => {
    await simulateDelay();
    return {
        partners: DB.get('partners').map(ResponseSanitizer.sanitizePartner),
        services: DB.get('services'),
        logisticsPartners: DB.get('logisticsPartners'),
        reviews: DB.get('reviews'),
        users: DB.get('users').map(ResponseSanitizer.sanitizeUser),
        orderHistory: DB.get('orderHistory').map(ResponseSanitizer.sanitizeOrder),
        partnerApplications: DB.get('partnerApplications'),
        supportTickets: DB.get('supportTickets'),
        chats: DB.get('chats'),
        promoCodes: DB.get('promoCodes'),
        loyaltySettings: DB.get('loyaltySettings'),
        referralSettings: DB.get('referralSettings'),
        appNotifications: DB.get('appNotifications'),
        notificationAnalytics: DB.get('notificationAnalytics'),
        advertisements: DB.get('advertisements'),
        applicationSettings: DB.get('applicationSettings'),
        trackingSettings: DB.get('trackingSettings'),
        commissionSettings: DB.get('commissionSettings'),
        siteContent: DB.get('siteContent'),
        subscriptionPlans: DB.get('subscriptionPlans'),
        invoices: DB.get('invoices'),
        refundRequests: DB.get('refundRequests'),
    };
};

export const apiLogin = async (payload: LoginRequest) => {
    await simulateDelay();
    const users: BackendUser[] = DB.get('users');
    const user = users.find(u => u.email === payload.email);
    if (!user) throw new Error('Invalid credentials');
    // NOTE: In production, compare bcrypt hashes. Here we do a simple string comparison for mock.
    if (user.passwordHash !== payload.password) throw new Error('Invalid credentials');
    return { user: ResponseSanitizer.sanitizeUser(user), token: `TOKEN-${user.id}` };
};

export const apiRegister = async (payload: RegisterRequest, t: any) => {
    await simulateDelay();
    const users: BackendUser[] = DB.get('users');
    if (users.some(u => u.email === payload.email)) throw new Error(t('notifications.emailExists'));
    const newUser: BackendUser = {
      id: `USER-${Date.now()}`,
      name: payload.name, email: payload.email, phone: payload.phone, passwordHash: payload.password,
      role: 'customer', pickupAddress: payload.pickupAddress, loyaltyPoints: 0,
      referralCode: `LE-${Array.from({ length: 8 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('')}`,
      createdAt: new Date().toISOString(), is2FAEnabled: false,
      notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true },
      isEmailValid: true,
    };
    DB.addItem('users', newUser);
    sendTransactionalEmail({ to: newUser.email, subject: t('emails.welcome.subject', { userName: newUser.name }), bodyComponent: <WelcomeEmail userName={newUser.name} />, t });
    return { user: ResponseSanitizer.sanitizeUser(newUser), token: `TOKEN-${newUser.id}` };
};

export const apiAnalyzeLaundryImage = async (imageData: string, articles: string[]) => {
    const ai = getAI();
    if (!ai) return [];
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { inlineData: { mimeType: 'image/jpeg', data: imageData } },
            { text: `Analyze this image of laundry. Identify the items from this allowed list: ${articles.join(', ')}. Return a JSON array of objects with "itemName" and "quantity".` }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        itemName: { type: Type.STRING },
                        quantity: { type: Type.NUMBER }
                    },
                    required: ["itemName", "quantity"]
                }
            }
        }
    });
    return JSON.parse(response.text || '[]');
};

export const apiAnalyzeStainImage = async (imageData: string) => {
    const ai = getAI();
    if (!ai) return { stainType: 'unavailable', confidence: 0, recommendation: 'AI not configured', serviceSuggestion: 'PRESSING' };
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { inlineData: { mimeType: 'image/jpeg', data: imageData } },
            { text: "Analyze this stain on a garment. Identify what it likely is and suggest the best treatment. Also recommend if it needs 'PRESSING' (dry cleaning) or 'BLANCHISSERIE' (laundry). Return JSON." }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    stainType: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    recommendation: { type: Type.STRING },
                    serviceSuggestion: { type: Type.STRING, enum: ['PRESSING', 'BLANCHISSERIE'] }
                },
                required: ["stainType", "confidence", "recommendation", "serviceSuggestion"]
            }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const apiGetChatbotResponse = async (message: string) => {
    const ai = getAI();
    if (!ai) return "AI not configured. Please contact support.";
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
            systemInstruction: "You are the Laundry Express RDC assistant. You help customers in Kinshasa and other DRC cities with their laundry orders. Be helpful, professional, and aware of local communes like Gombe, Ngaliema, and Limete."
        }
    });
    return response.text || "I'm sorry, I'm having trouble connecting right now.";
};

export const apiAnalyzePartnerHealth = async (partnerId: string) => {
    const ai = getAI();
    if (!ai) return { score: 50, summary: 'AI not configured' };
    const partners = DB.get('partners');
    const partner = partners.find((p: any) => p.id === partnerId);
    const orders = DB.get('orderHistory').filter((o: any) => o.partner?.id === partnerId);
    
    const context = `Partner: ${partner?.name}. Total Orders: ${orders.length}. Rating: ${partner?.rating}. Recent Statuses: ${orders.slice(-5).map((o: any) => o.status).join(', ')}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze the health of this laundry business based on this data: ${context}. Provide a health score (0-100) and a brief summary. Return JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    summary: { type: Type.STRING }
                },
                required: ["score", "summary"]
            }
        }
    });
    return JSON.parse(response.text || '{"score": 50, "summary": "Insufficient data"}');
};

export const apiGenerateMarketingPromo = async (prompt: string) => {
    const ai = getAI();
    if (!ai) return { promoCode: 'PROMO10', marketingText: 'Discount available', discountType: 'percentage', discountValue: 10, bannerConcept: prompt, bannerImageUrl: '' };
    const bannerResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A vibrant marketing banner for a Congolese laundry service: ${prompt}. Cinematic lighting, professional product photography style.`,
        config: { numberOfImages: 1, aspectRatio: '16:9' }
    });

    const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a marketing campaign based on: ${prompt}. Suggest a catchy promo code and a marketing text for social media. Return JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    promoCode: { type: Type.STRING },
                    marketingText: { type: Type.STRING },
                    discountType: { type: Type.STRING, enum: ['percentage', 'fixed'] },
                    discountValue: { type: Type.NUMBER }
                },
                required: ["promoCode", "marketingText", "discountType", "discountValue"]
            }
        }
    });

    const bannerBytes = bannerResponse.generatedImages[0].image.imageBytes;
    const details = JSON.parse(textResponse.text || '{}');

    return {
        ...details,
        bannerConcept: prompt,
        bannerImageUrl: `data:image/jpeg;base64,${bannerBytes}`
    };
};

export const apiGenerateDemandForecast = async (orders: Order[]) => {
    const ai = getAI();
    if (!ai) return [];
    const data = orders.map(o => ({ date: o.createdAt, total: o.totalPrice }));
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Predict laundry demand for the next 7 days based on this history: ${JSON.stringify(data)}. Return a JSON array of 7 objects with "date" and "demandLevel" (low, average, high).`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING },
                        demandLevel: { type: Type.STRING, enum: ['low', 'average', 'high'] }
                    },
                    required: ["date", "demandLevel"]
                }
            }
        }
    });
    return JSON.parse(response.text || '[]');
};

// FIX: Added missing API functions for AI analysis, review management, route optimization, and subscription handling.
export const apiAnalyzeUserHistoryForRecommendations = async (orders: Order[]) => {
    const ai = getAI();
    if (!ai) return 'Book a cleaning to get personalized recommendations!';
    const data = orders.map(o => ({ service: o.serviceItems.map(si => si.service.title).join(','), date: o.createdAt }));
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this laundry history, suggest a personalized recommendation (e.g. next cleaning date, or a service they might like): ${JSON.stringify(data)}. Return a simple string recommendation.`,
    });
    return response.text;
};

export const apiAnalyzePartnerReviews = async (reviews: Review[]) => {
    const ai = getAI();
    if (!ai) return { sentiment: 'unavailable', keyPoints: [] };
    const texts = reviews.map(r => r.comment).join('\n');
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize the sentiment and key points from these customer reviews for a laundry business: \n${texts}. Return JSON with "sentiment" (string) and "keyPoints" (array of strings).`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sentiment: { type: Type.STRING },
                    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["sentiment", "keyPoints"]
            }
        }
    });
    return JSON.parse(response.text || '{"sentiment": "neutral", "keyPoints": []}');
};

export const apiGenerateReviewResponse = async (review: Review, authorName: string) => {
    const ai = getAI();
    if (!ai) return "Thank you for your feedback!";
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a professional and friendly response to this customer review: "${review.comment}" (Rating: ${review.rating}/5). The customer's name is ${authorName}. Mention that this is on behalf of the laundry service.`,
    });
    return response.text || "Thank you for your feedback!";
};

export const apiSubmitReviewReply = async (reviewId: string, replyText: string) => {
    await simulateDelay();
    return DB.updateItem('reviews', reviewId, { reply: replyText });
};

export const apiRegeneratePromoImage = async (code: string, val: number, type: string, concept: string) => {
    const ai = getAI();
    if (!ai) return { bannerImageUrl: '' };
    const bannerResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A promotional banner for a laundry service with code ${code}, giving ${val}${type === 'percentage' ? '%' : '$'} off. Concept: ${concept}`,
        config: { numberOfImages: 1, aspectRatio: '16:9' }
    });
    const bannerBytes = bannerResponse.generatedImages[0].image.imageBytes;
    return {
        bannerImageUrl: `data:image/jpeg;base64,${bannerBytes}`
    };
};

export const apiSuggestReassignment = async (order: Order, partners: Partner[], services: Service[]) => {
    const ai = getAI();
    if (!ai) return { suggestedPartnerId: null, justification: 'AI not configured', rankedOptions: [] };
    const orderServices = order.serviceItems.map(si => si.service.title).join(', ');
    const partnerList = partners.map(p => ({ id: p.id, name: p.name, services: p.serviceIds, rating: p.rating }));
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest which partner to reassign this order to. Order services: ${orderServices}. Partner list: ${JSON.stringify(partnerList)}. Consider services offered and ratings. Return JSON with "suggestedPartnerId", "justification", and "rankedOptions" (array of partner objects).`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestedPartnerId: { type: Type.STRING, nullable: true },
                    justification: { type: Type.STRING },
                    rankedOptions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING } } } }
                },
                required: ["justification", "rankedOptions"]
            }
        }
    });
    return JSON.parse(response.text || '{"suggestedPartnerId": null, "justification": "Could not determine", "rankedOptions": []}');
};

export const apiOptimizeRoutes = async (logisticsPartnerId: string) => {
    const ai = getAI();
    if (!ai) return [];
    const orders = DB.get('orderHistory').filter((o: any) => o.status === OrderStatus.READY_FOR_PICKUP || o.status === OrderStatus.READY_FOR_DELIVERY);
    const drivers = DB.get('users').filter((u: any) => u.logisticsPartnerId === logisticsPartnerId && u.role === 'driver' && u.driverStatus === 'AVAILABLE');
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Optimize delivery routes for these orders: ${JSON.stringify(orders)} using these drivers: ${JSON.stringify(drivers)}. Return JSON array of OptimizedRoute objects.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        driverId: { type: Type.STRING },
                        driverName: { type: Type.STRING },
                        missions: { 
                            type: Type.ARRAY, 
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    orderId: { type: Type.STRING },
                                    type: { type: Type.STRING, enum: ['PICKUP', 'DELIVERY'] },
                                    clientOrPartnerName: { type: Type.STRING },
                                    address: { type: Type.STRING }
                                },
                                required: ["orderId", "type", "clientOrPartnerName", "address"]
                            }
                        },
                        estimatedTime: { type: Type.STRING }
                    },
                    required: ["driverId", "driverName", "missions", "estimatedTime"]
                }
            }
        }
    });
    return JSON.parse(response.text || '[]');
};

export const apiConfirmOptimizedRoutes = async (routes: OptimizedRoute[]) => {
    await simulateDelay();
    routes.forEach(route => {
        route.missions.forEach(mission => {
            DB.updateItem('orderHistory', mission.orderId, { 
                driverId: route.driverId,
                status: mission.type === 'PICKUP' ? OrderStatus.PICKUP : OrderStatus.DELIVERY
            });
        });
        DB.updateItem('users', route.driverId, { driverStatus: 'ON_MISSION' });
    });
};

export const apiAddAdmin = async (adminData: any) => {
    await simulateDelay();
    const newAdmin = {
        ...adminData,
        id: `ADMIN-${Date.now()}`,
        role: 'admin',
        createdAt: new Date().toISOString(),
        is2FAEnabled: false,
        notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true },
        isEmailValid: true,
    };
    DB.addItem('users', newAdmin);
    return newAdmin;
};

export const apiUpdateUserPermissions = async (userId: string, permissions: AdminPermissions) => {
    await simulateDelay();
    const permissionArray = (Object.keys(permissions) as AdminSection[]).filter(k => (permissions as any)[k]);
    return DB.updateItem('users', userId, { permissions: permissionArray });
};

export const apiAddSubscriptionPlan = async (p: SubscriptionPlan) => {
    await simulateDelay();
    DB.addItem('subscriptionPlans', p);
    return p;
};

export const apiUpdateSubscriptionPlan = async (p: SubscriptionPlan) => {
    await simulateDelay();
    return DB.updateItem('subscriptionPlans', p.id, p);
};

export const apiUpdateUser = async (updatedUser: User): Promise<User> => { await simulateDelay(); return DB.updateItem('users', updatedUser.id, updatedUser); };
export const apiCreateOrder = async (orderData: CreateOrderRequest, userId: string, t: any): Promise<Order> => {
    await simulateDelay();
    const newOrder: Order = {
        id: `ORD-${Date.now()}`, userId, ...orderData,
        status: OrderStatus.AWAITING_CONFIRMATION,
        trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: new Date().toISOString() }],
        totalPrice: orderData.totalPrice || 0, createdAt: new Date().toISOString(),
    };
    DB.addItem('orderHistory', newOrder);
    return newOrder;
};
export const apiUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, t: any, rej?: string, est?: string) => {
    await simulateDelay();
    const order = DB.get('orderHistory').find((o: any) => o.id === orderId);
    if (!order) return;
    DB.updateItem('orderHistory', orderId, { 
        status: newStatus, 
        trackingHistory: [...order.trackingHistory, { status: newStatus, time: new Date().toISOString() }],
        rejectionReason: rej, estimatedCompletionTime: est
    });
};
export const apiFetchAppNotifications = async () => DB.get('appNotifications');
export const apiAddAppNotification = async (n: any) => DB.addItem('appNotifications', { ...n, id: `N-${Date.now()}`, createdAt: new Date().toISOString(), isRead: false });
export const apiMarkNotificationsAsRead = async (uid: string) => {
    const ns = DB.get('appNotifications').map((n: any) => n.recipientId === uid ? { ...n, isRead: true } : n);
    DB.set('appNotifications', ns);
};
export const apiMarkSingleNotificationAsRead = async (id: string) => DB.updateItem('appNotifications', id, { isRead: true });
export const apiUpdatePartner = async (p: Partner) => DB.updateItem('partners', p.id, p);
export const apiUpdateSiteContent = async (c: SiteContent) => DB.set('siteContent', c);
export const apiSubmitPartnerApplication = async (a: any) => {
    const required = ['companyName', 'partnerType', 'contactName', 'phone', 'email'];
    for (const field of required) {
        if (!a[field]) {
            throw new Error(`Le champ ${field} est requis.`);
        }
    }

    const existingApps = DB.get('partnerApplications');
    if (existingApps.some((app: any) => app.email === a.email && app.status !== ApplicationStatus.REJECTED)) {
        throw new Error('Une candidature avec cet email existe deja.');
    }

    const n = {
        ...a,
        id: `APP-${Date.now()}`,
        status: ApplicationStatus.PENDING,
        submittedAt: new Date().toISOString(),
        capacity: a.capacity || '',
    };
    DB.addItem('partnerApplications', n);

    DB.addItem('appNotifications', {
        id: `NOTIF-${Date.now()}`,
        recipientId: 'USER-ADMIN',
        message: `Nouvelle candidature: ${a.companyName} (${a.partnerType})`,
        notificationType: NotificationType.GENERAL,
        link: { page: 'admin', params: { section: 'partner-applications' } },
        createdAt: new Date().toISOString(),
        isRead: false,
    });

    return n;
};

export const apiApprovePartnerApplication = async (id: string, t: any) => { 
    const apps = DB.get('partnerApplications');
    const app = apps.find((a: any) => a.id === id);
    if (!app) {
        throw new Error(`Application ${id} not found`);
    }

    DB.updateItem('partnerApplications', id, { status: ApplicationStatus.APPROVED });

    const newPartner: Partner = {
        id: `PARTNER-${Date.now()}`,
        name: app.companyName,
        slug: app.companyName.toLowerCase().replace(/\s+/g, '-'),
        type: app.partnerType,
        rating: 0,
        reviewCount: 0,
        imageUrls: [],
        address: app.address,
        coordinates: { lat: -4.325, lng: 15.322 },
        isFeatured: false,
        enabledFeatures: { promotions: true, financials: true, analytics: true, customDomain: false, customSubdomain: false, teamManagement: true, apiAccess: false, advancedAutomation: false, aiReviewAssistant: false },
        commissionRate: 0.15,
        currency: 'USD',
        workingHours: defaultWorkingHours,
    };
    DB.addItem('partners', newPartner);

    const referralChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referralCode = 'LE-';
    for (let i = 0; i < 8; i++) {
        referralCode += referralChars.charAt(Math.floor(Math.random() * referralChars.length));
    }

    const newUser: User = {
        id: `USER-${Date.now()}`,
        name: app.contactName,
        email: app.email,
        phone: app.phone,
        role: 'partner-owner',
        partnerId: newPartner.id,
        pickupAddress: { commune: 'Gombe', avenue: app.address, numero: '' },
        loyaltyPoints: 0,
        referralCode,
        createdAt: new Date().toISOString(),
        is2FAEnabled: false,
        notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true },
        isEmailValid: true,
    };
    DB.addItem('users', newUser);

    DB.addItem('appNotifications', {
        id: `NOTIF-${Date.now()}-APPROVED`,
        recipientId: 'USER-ADMIN',
        message: `Candidature approuvee: ${app.companyName}. Partenaire et compte crees.`,
        notificationType: NotificationType.GENERAL,
        createdAt: new Date().toISOString(),
        isRead: false,
    });

    return { newPartner, newUser };
};

export const apiRejectPartnerApplication = async (id: string, r: string) => DB.updateItem('partnerApplications', id, { status: ApplicationStatus.REJECTED, rejectionReason: r });
export const apiDeletePartner = async (id: string) => DB.deleteItem('partners', id);
export const apiLinkUserToPartner = async (uid: string, pid: string) => DB.updateItem('users', uid, { partnerId: pid, role: 'partner-owner' });
export const apiLinkUserToLogisticsPartner = async (uid: string, lpid: string) => DB.updateItem('users', uid, { logisticsPartnerId: lpid, role: 'logistics-manager' });
export const apiAddService = async (s: any) => { const n = { ...s, id: `SERV-${Date.now()}` }; DB.addItem('services', n); return n; };
export const apiUpdateService = async (s: Service) => DB.updateItem('services', s.id, s);
export const apiDeleteService = async (id: string) => DB.deleteItem('services', id);
export const apiUpdatePartnerServiceIds = async (pid: string, sids: string[]) => DB.updateItem('partners', pid, { serviceIds: sids });
export const apiAddDriver = async (d: any, lpid: string) => { const n = { ...d, id: `D-${Date.now()}`, role: 'driver', logisticsPartnerId: lpid, driverStatus: 'AVAILABLE', createdAt: new Date().toISOString() }; DB.addItem('users', n); return n; };
export const apiUpdateLoyaltySettings = async (s: LoyaltySettings) => DB.set('loyaltySettings', s);
export const apiUpdateReferralSettings = async (s: ReferralSettings) => DB.set('referralSettings', s);
export const apiUpdateTrackingSettings = async (s: TrackingSettings) => DB.set('trackingSettings', s);
export const apiUpdateCommissionSettings = async (s: CommissionSettings) => DB.set('commissionSettings', s);

export const apiAssignDriverToOrder = async (oid: string, did: string, t: any) => DB.updateItem('orderHistory', oid, { driverId: did, status: OrderStatus.PICKUP });
export const apiAssignDriverForDelivery = async (oid: string, did: string, t: any) => DB.updateItem('orderHistory', oid, { driverId: did, status: OrderStatus.DELIVERY });
export const apiReassignPartner = async (oid: string, pid: string, t: any) => { const p = DB.get('partners').find((p: any) => p.id === pid); return DB.updateItem('orderHistory', oid, { partner: p }); };
export const apiSubmitReview = async (oid: string, uid: string, r: number, c: string, t: any) => {
    const o = DB.get('orderHistory').find((o: any) => o.id === oid);
    const rev = { id: `REV-${Date.now()}`, orderId: oid, userId: uid, rating: r, comment: c, createdAt: new Date().toISOString(), partnerId: o.partner.id };
    DB.addItem('reviews', rev);
    DB.updateItem('orderHistory', oid, { isReviewed: true });
    return { pointsEarned: 10, newTotalPoints: 100 }; 
};

export const apiAddPromoCode = async (p: any) => DB.addItem('promoCodes', { ...p, id: `P-${Date.now()}`, createdAt: new Date().toISOString(), usageCount: 0 });
export const apiUpdatePromoCode = async (p: PromoCode) => DB.updateItem('promoCodes', p.id, p);
export const apiDeletePromoCode = async (id: string) => DB.deleteItem('promoCodes', id);
export const apiUpdateApplicationSettings = async (s: ApplicationSettings) => DB.set('applicationSettings', s);
export const apiSubmitRefundRequest = async (r: any, u: User, o: Order) => { const nr = { ...r, id: `REF-${Date.now()}`, status: RefundStatus.PENDING, createdAt: new Date().toISOString(), userName: u.name, requestedAmount: o.totalPrice }; DB.addItem('refundRequests', nr); return nr; };
export const apiApproveRefundRequest = async (id: string, n: string) => DB.updateItem('refundRequests', id, { status: RefundStatus.APPROVED, resolutionNotes: n });
export const apiRejectRefundRequest = async (id: string, n: string) => DB.updateItem('refundRequests', id, { status: RefundStatus.REJECTED, resolutionNotes: n });
export const apiAnalyzeActivityLogsForAnomalies = async (pid: string) => [];
export const apiUpdatePartnerInventory = async (pid: string, inv: InventoryItem[]) => DB.updateItem('partners', pid, { inventory: inv });
export const apiUpdatePartnerDeliverySettings = async (pid: string, s: DeliverySettings) => DB.updateItem('partners', pid, { deliverySettings: s });
export const apiGenerateProforma = async (id: string) => DB.updateItem('orderHistory', id, { proformaGeneratedAt: new Date().toISOString() });
export const apiGenerateInvoice = async (id: string) => DB.updateItem('orderHistory', id, { invoiceGeneratedAt: new Date().toISOString() });
export const apiConsumeNotificationActions = async (id: string) => DB.updateItem('appNotifications', id, { actions: [] });
export const apiRegeneratePartnerApiKey = async (id: string) => { const k = `pk_live_${Math.random().toString(36).slice(2)}`; DB.updateItem('partners', id, { apiKey: k }); return { apiKey: k }; };
export const apiUpdatePartnerWebhooks = async (id: string, u: string, e: any) => DB.updateItem('partners', id, { webhookUrl: u, subscribedWebhookEvents: e });
export const apiFetchPartnerIntegrations = async (id: string) => ({ apiKey: 'mock', webhookUrl: '', subscribedWebhookEvents: [] });
export const apiEnable2FA = async (id: string, c: string) => ({ success: true, user: DB.updateItem('users', id, { is2FAEnabled: true }) });
export const apiDisable2FA = async (id: string) => DB.updateItem('users', id, { is2FAEnabled: false });
export const apiFetchActivityLogs = async (id: string) => [];
export const apiFetchAllActivityLogs = async () => [];
export const apiAddTeamMember = async (pid: string, d: any) => { const n = { ...d, id: `T-${Date.now()}`, partnerId: pid }; DB.addItem('users', n); return n; };
export const apiUpdateTeamMemberRole = async (id: string, r: TeamMemberRole) => DB.updateItem('users', id, { role: r });
export const apiRemoveTeamMember = async (id: string) => DB.updateItem('users', id, { partnerId: undefined });
export const apiUpdatePartnerAutomationSettings = async (id: string, s: AutomationSettings) => DB.updateItem('partners', id, { automationSettings: s });
export const apiSubscribePartner = async (pid: string, plid: string, cy: string) => { };
export const addSubscriptionPlan = async (p: SubscriptionPlan) => { };
export const updateSubscriptionPlan = async (p: SubscriptionPlan) => { };
export const apiAddAdvertisement = async (d: any) => { 
    const n = { ...d, id: `AD-${Date.now()}`, createdAt: new Date().toISOString() };
    DB.addItem('advertisements', n);
};
export const apiUpdateAdvertisement = async (a: Advertisement) => DB.updateItem('advertisements', a.id, a);
export const apiDeleteAdvertisement = async (id: string) => DB.deleteItem('advertisements', id);

export const apiCreateSupportTicket = async (data: any) => {
    const n = { ...data, id: `TICK-${Date.now()}`, status: TicketStatus.OPEN, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [{ id: `M-${Date.now()}`, authorId: data.userId, authorName: 'User', message: data.message, createdAt: new Date().toISOString() }] };
    DB.addItem('supportTickets', n);
    return n;
};
export const apiAddMessageToTicket = async (ticketId: string, messageData: any) => {
    const t = DB.get('supportTickets').find((x: any) => x.id === ticketId);
    if (!t) return;
    const newMsg = { ...messageData, id: `MSG-${Date.now()}`, createdAt: new Date().toISOString() };
    DB.updateItem('supportTickets', ticketId, { messages: [...t.messages, newMsg], updatedAt: new Date().toISOString() });
};
export const apiUpdateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    DB.updateItem('supportTickets', ticketId, { status, updatedAt: new Date().toISOString() });
};
export const apiAddMessageToChat = async (orderId: string, messageData: any) => {
    const chats = DB.get('chats');
    let chat = chats.find((c: any) => c.orderId === orderId);
    if (!chat) {
        chat = { id: `CHAT-${Date.now()}`, orderId, participants: [messageData.authorId], messages: [] };
        DB.addItem('chats', chat);
    }
    const newMsg = { ...messageData, id: `CMSG-${Date.now()}`, createdAt: new Date().toISOString() };
    DB.updateItem('chats', chat.id, { messages: [...chat.messages, newMsg] });
};
export const apiMuteChat = async (chatId: string, duration: number) => {
    DB.updateItem('chats', chatId, { mutedUntil: duration > 0 ? new Date(Date.now() + duration).toISOString() : undefined });
};
export const apiLogNotificationEvent = async (notif: AppNotification, event: 'read' | 'click') => {
    DB.addItem('notificationAnalytics', { notificationId: notif.id, event, timestamp: new Date().toISOString() });
};
export const apiSendBulkNotifications = async (target: BulkNotificationTarget, message: string) => {
    const users = DB.get('users');
    const recipients = target === 'allUsers' ? users : users.filter((u: any) => u.partnerId);
    recipients.forEach((u: any) => {
        DB.addItem('appNotifications', { id: `N-${Date.now()}-${u.id}`, recipientId: u.id, message, notificationType: NotificationType.GENERAL, createdAt: new Date().toISOString(), isRead: false });
    });
    return recipients.length;
};
export const apiReassignDriver = async (orderId: string, oldDriverId: string, newDriverId: string, t: any) => {
    DB.updateItem('orderHistory', orderId, { driverId: newDriverId });
};
export const apiAddLogisticsPartner = async (name: string) => {
    const partner = { id: `LOG-${Date.now()}`, name };
    DB.addItem('logisticsPartners', partner);
    return partner;
};
export const apiUpdateLogisticsPartner = async (partner: LogisticsPartner) => {
    DB.updateItem('logisticsPartners', partner.id, partner);
};
export const apiDeleteLogisticsPartner = async (partnerId: string) => {
    DB.deleteItem('logisticsPartners', partnerId);
};
