import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AutomationSettings, OrderStatus, ServiceType, BusinessHours } from '../../types';
import { Icon } from '../../components/Icon';

const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: string;
    description: string;
}> = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div className="flex-1 mr-4">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">{label}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={onChange} 
                className="sr-only peer" 
            />
            <div className="w-12 h-7 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-blue"></div>
        </label>
    </div>
);

const TimeInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    label: string;
}> = ({ value, onChange, label }) => (
    <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label}
        </label>
        <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base"
            style={{ minHeight: '44px' }}
        />
    </div>
);

const TemplateToken: React.FC<{
    token: string;
    description: string;
    onInsert: (token: string) => void;
}> = ({ token, description, onInsert }) => (
    <button
        onClick={() => onInsert(token)}
        className="flex flex-col items-start p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors w-full text-left"
        style={{ minHeight: '60px' }}
        title={description}
    >
        <code className="font-mono text-brand-blue text-sm">{token}</code>
        <span className="text-slate-500 dark:text-slate-400 mt-1 text-xs leading-tight">{description}</span>
    </button>
);

const TimezoneSelector: React.FC<{
    value: string;
    onChange: (timezone: string) => void;
}> = ({ value, onChange }) => {
    const timezoneGroups = {
        "Americas": [
            "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
            "America/Toronto", "America/Vancouver", "America/Mexico_City", "America/Sao_Paulo",
        ],
        "Europe": [
            "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid",
            "Europe/Rome", "Europe/Amsterdam", "Europe/Brussels", "Europe/Moscow",
        ],
        "Asia": [
            "Asia/Dubai", "Asia/Riyadh", "Asia/Kolkata", "Asia/Singapore",
            "Asia/Hong_Kong", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul",
        ],
        "Africa": [
            "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Casablanca",
            "Africa/Nairobi", "Africa/Accra",
        ],
        "Middle East": [
            "Asia/Dubai", "Asia/Qatar", "Asia/Kuwait", "Asia/Bahrain",
            "Asia/Riyadh", "Asia/Tehran", "Asia/Jerusalem",
        ],
        "Pacific": [
            "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane",
            "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu",
        ]
    };

    const formatTimezoneOffset = (timezone: string) => {
        try {
            const formatter = new Intl.DateTimeFormat('en', {
                timeZone: timezone,
                timeZoneName: 'short'
            });
            const parts = formatter.formatToParts(new Date());
            const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
            return timeZoneName ? ` ${timeZoneName}` : '';
        } catch {
            return '';
        }
    };

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base"
            style={{ minHeight: '44px' }}
        >
            <option value="">Select Timezone</option>
            {Object.entries(timezoneGroups).map(([region, timezones]) => (
                <optgroup key={region} label={region}>
                    {timezones.map(tz => (
                        <option key={tz} value={tz}>
                            {tz.replace(/_/g, ' ')} ({formatTimezoneOffset(tz)})
                        </option>
                    ))}
                </optgroup>
            ))}
        </select>
    );
};

// Default message templates
const defaultMessageTemplates = {
    // Order Status Updates
    [OrderStatus.CONFIRMED]: "Hi {customerName}, your order #{orderNumber} has been confirmed! We'll start processing it soon.",
    [OrderStatus.PROCESSING]: "Hi {customerName}, we're now processing your {serviceType} order #{orderNumber}. Estimated completion: {estimatedTime}.",
    [OrderStatus.READY_FOR_PICKUP]: "Hi {customerName}, your order #{orderNumber} is ready for pickup! You can collect it until {pickupTime}.",
    [OrderStatus.READY_FOR_DELIVERY]: "Hi {customerName}, your order #{orderNumber} is out for delivery! Expected delivery: {deliveryTime}.",
    [OrderStatus.COMPLETED]: "Thank you for choosing us, {customerName}! Order #{orderNumber} has been completed. We hope to see you again soon! 💫",
    [OrderStatus.DELAYED]: "Hi {customerName}, we apologize for the delay with order #{orderNumber}. New estimated time: {newEstimatedTime}. Thank you for your patience!",
    
    // Payment & Invoice Messages
    PAYMENT_CONFIRMED: "Hi {customerName}, payment for order #{orderNumber} has been confirmed. Total: {totalAmount}",
    PAYMENT_FAILED: "Hi {customerName}, we encountered an issue with your payment for order #{orderNumber}. Please update your payment method.",
    INVOICE_READY: "Hi {customerName}, your invoice for order #{orderNumber} is ready. Amount: {totalAmount}. View: {invoiceLink}",
    
    // Delivery & Pickup Messages
    DRIVER_ASSIGNED: "Hi {customerName}, {driverName} is assigned to deliver your order #{orderNumber}. Contact: {driverPhone}",
    OUT_FOR_DELIVERY: "Hi {customerName}, your order #{orderNumber} is out for delivery! Track here: {trackingLink}",
    DELIVERY_ATTEMPT_FAILED: "Hi {customerName}, we missed you for order #{orderNumber} delivery. Please contact us to reschedule.",
    PICKUP_REMINDER: "Hi {customerName}, friendly reminder: order #{orderNumber} is ready for pickup at {businessAddress}",
    
    // Customer Service & Follow-up
    WELCOME_NEW_CUSTOMER: "Welcome {customerName}! 🎉 Thanks for choosing our laundry service. Use code WELCOME10 for 10% off your next order!",
    FEEDBACK_REQUEST: "Hi {customerName}, how was your experience with order #{orderNumber}? Rate us: {feedbackLink}",
    LOYALTY_UPDATE: "Hi {customerName}, you've earned {points} loyalty points! Total: {totalPoints}. Redeem: {rewardsLink}",
    SUBSCRIPTION_RENEWAL: "Hi {customerName}, your laundry subscription renews in 3 days. Total: {renewalAmount}",
    
    // Appointment & Scheduling
    APPOINTMENT_CONFIRMATION: "Hi {customerName}, your appointment for {serviceType} is confirmed for {appointmentDate} at {appointmentTime}",
    APPOINTMENT_REMINDER_24H: "Reminder: Your laundry appointment is tomorrow at {appointmentTime}. See you then!",
    APPOINTMENT_REMINDER_2H: "Friendly reminder: Your appointment is in 2 hours at {appointmentTime}",
    
    // Quality & Service Updates
    QUALITY_CHECK_PASSED: "Great news {customerName}! Your order #{orderNumber} passed our quality check with flying colors 🎉",
    SPECIAL_CARE_UPDATE: "Hi {customerName}, we're giving special care to delicate items in order #{orderNumber}. Everything's looking great!",
    
    // Promotional Messages
    SPECIAL_OFFER: "Hi {customerName}! Special offer just for you: {promoDescription}. Use code: {promoCode}",
    BIRTHDAY_GREETING: "Happy Birthday {customerName}! 🎂 Enjoy 20% off your next order with code BDAY20",
};

export const AutomationPage: React.FC = () => {
    const { user, partners, addNotification, t, apiUpdatePartnerAutomationSettings, services } = useAppContext();
    const partner = partners.find(p => p.id === user?.partnerId);
    
    const defaultSettings: AutomationSettings = {
        autoAccept: false,
        autoAcceptMaxPrice: 0,
        autoMessages: false,
        messages: defaultMessageTemplates,
        businessHours: {
            enabled: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            monday: { open: '09:00', close: '18:00', enabled: true },
            tuesday: { open: '09:00', close: '18:00', enabled: true },
            wednesday: { open: '09:00', close: '18:00', enabled: true },
            thursday: { open: '09:00', close: '18:00', enabled: true },
            friday: { open: '09:00', close: '18:00', enabled: true },
            saturday: { open: '10:00', close: '16:00', enabled: false },
            sunday: { open: '10:00', close: '16:00', enabled: false }
        },
        serviceTypeFilters: [],
        customerTypeFilters: [],
        escalationRules: {
            notifyOnFailure: true,
            fallbackAction: 'hold_for_review',
            maxRetries: 3,
            escalationEmail: '',
            notificationPreferences: {
                email: true,
                sms: false,
                push: true
            },
            autoDeclineEnabled: false,
            autoDeclineMaxPrice: 0,
            autoDeclineComplexServices: [],
            autoDeclineMaxDistance: 0,
            priorityHandling: false,
            priorityVipCustomers: false,
            priorityMinOrderValue: 0,
            priorityUrgentServices: []
        },
        advancedMessaging: {
            enableEmojis: true,
            characterLimit: 160,
            enableDeliveryReports: false,
            enableAppointmentReminders: true,
            enablePromotionalMessages: false
        },
        analytics: {
            timeSaved: 0,
            ordersProcessed: 0,
            messagesSent: 0,
            errorCount: 0
        }
    };

    const [settings, setSettings] = useState<AutomationSettings>(partner?.automationSettings || defaultSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'messaging' | 'rules' | 'analytics'>('basic');
    const [showMessagePreview, setShowMessagePreview] = useState<{ [key: string]: boolean }>({});
    const [testOrderData] = useState({
        customerName: 'John Doe',
        orderNumber: 'ORD-12345',
        estimatedTime: '2 hours',
        serviceType: 'Laundry',
        deliveryTime: '3:00 PM',
        pickupTime: '5:00 PM',
        totalAmount: '$45.00',
        driverName: 'Mike Johnson',
        driverPhone: '+1234567890'
    });

    useEffect(() => {
        if (partner) {
            setSettings(partner.automationSettings || defaultSettings);
        }
    }, [partner]);

    const templateTokens = [
        { token: '{customerName}', description: t('automationPage.templateTokens.customerName') },
        { token: '{orderNumber}', description: t('automationPage.templateTokens.orderNumber') },
        { token: '{estimatedTime}', description: t('automationPage.templateTokens.estimatedTime') },
        { token: '{serviceType}', description: t('automationPage.templateTokens.serviceType') },
        { token: '{pickupTime}', description: t('automationPage.templateTokens.pickupTime') },
        { token: '{deliveryTime}', description: t('automationPage.templateTokens.deliveryTime') },
        { token: '{totalAmount}', description: t('automationPage.templateTokens.totalAmount') },
        { token: '{driverName}', description: t('automationPage.templateTokens.driverName') },
        { token: '{driverPhone}', description: t('automationPage.templateTokens.driverPhone') },
        { token: '{businessAddress}', description: t('automationPage.templateTokens.businessAddress') },
    ];

    // All message categories
    const messageCategories = {
        orderStatus: [
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.READY_FOR_DELIVERY,
            OrderStatus.COMPLETED,
            OrderStatus.DELAYED,
        ],
        payment: [
            'PAYMENT_CONFIRMED',
            'PAYMENT_FAILED',
            'INVOICE_READY',
        ],
        delivery: [
            'DRIVER_ASSIGNED',
            'OUT_FOR_DELIVERY',
            'DELIVERY_ATTEMPT_FAILED',
            'PICKUP_REMINDER',
        ],
        customerService: [
            'WELCOME_NEW_CUSTOMER',
            'FEEDBACK_REQUEST',
            'LOYALTY_UPDATE',
            'SUBSCRIPTION_RENEWAL',
        ],
        appointments: [
            'APPOINTMENT_CONFIRMATION',
            'APPOINTMENT_REMINDER_24H',
            'APPOINTMENT_REMINDER_2H',
        ],
        qualityUpdates: [
            'QUALITY_CHECK_PASSED',
            'SPECIAL_CARE_UPDATE',
        ],
        promotional: [
            'SPECIAL_OFFER',
            'BIRTHDAY_GREETING',
        ]
    };

    // Handler functions
    const handleSettingsChange = (updates: Partial<AutomationSettings>) => {
        setSettings(prev => ({...prev, ...updates}));
    };

    const handleMessageChange = (messageKey: string, text: string) => {
        setSettings(prev => ({
            ...prev,
            messages: {
                ...prev.messages,
                [messageKey]: text,
            }
        }));
    };

    const handleBusinessHoursChange = (day: keyof BusinessHours, field: string, value: any) => {
        setSettings(prev => {
            if (!prev.businessHours) return prev;
            
            // If it's a top-level field like 'enabled' or 'timezone'
            if (field === 'enabled' || field === 'timezone') {
                return {
                    ...prev,
                    businessHours: {
                        ...prev.businessHours,
                        [field]: value
                    }
                };
            }

            // If it's a day field (which is an object)
            const dayData = prev.businessHours[day as keyof Omit<BusinessHours, 'enabled' | 'timezone'>];
            if (typeof dayData === 'object' && dayData !== null) {
                return {
                    ...prev,
                    businessHours: {
                        ...prev.businessHours,
                        [day]: {
                            ...(dayData as any),
                            [field]: value
                        }
                    }
                };
            }
            
            return prev;
        });
    };

    const handleServiceTypeToggle = (serviceId: string) => {
        setSettings(prev => ({
            ...prev,
            serviceTypeFilters: prev.serviceTypeFilters!.includes(serviceId)
                ? prev.serviceTypeFilters!.filter(id => id !== serviceId)
                : [...prev.serviceTypeFilters!, serviceId]
        }));
    };

    const insertToken = (messageKey: string, token: string) => {
        const currentMessage = settings.messages[messageKey] || '';
        const textarea = document.getElementById(`message-${messageKey}`) as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            const newMessage = currentMessage.substring(0, start) + token + currentMessage.substring(end);
            handleMessageChange(messageKey, newMessage);
            
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + token.length, start + token.length);
            }, 0);
        }
    };

    const previewMessage = (messageKey: string, message: string) => {
        return message
            .replace(/{customerName}/g, testOrderData.customerName)
            .replace(/{orderNumber}/g, testOrderData.orderNumber)
            .replace(/{estimatedTime}/g, testOrderData.estimatedTime)
            .replace(/{serviceType}/g, testOrderData.serviceType)
            .replace(/{pickupTime}/g, testOrderData.pickupTime)
            .replace(/{deliveryTime}/g, testOrderData.deliveryTime)
            .replace(/{totalAmount}/g, testOrderData.totalAmount)
            .replace(/{driverName}/g, testOrderData.driverName)
            .replace(/{driverPhone}/g, testOrderData.driverPhone)
            .replace(/{businessAddress}/g, '123 Main St, Your City');
    };

    const calculateTimeSaved = () => {
        const ordersProcessed = settings.analytics?.ordersProcessed || 0;
        const messagesSent = settings.analytics?.messagesSent || 0;
        return {
            weekly: (ordersProcessed * 2 + messagesSent * 0.5) / 60,
            monthly: (ordersProcessed * 8 + messagesSent * 2) / 60
        };
    };

    const handleSave = async () => {
        if (!partner) return;
        setIsSaving(true);
        try {
            await apiUpdatePartnerAutomationSettings(partner.id, settings);
            addNotification(t('automationPage.saveSuccess'), 'success');
        } catch (error) {
            addNotification(t('automationPage.saveError'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestMessage = (messageKey: string) => {
        const message = settings.messages[messageKey];
        if (!message) {
            addNotification(t('automationPage.noMessageToTest'), 'info');
            return;
        }
        
        const preview = previewMessage(messageKey, message);
        addNotification(
            t('automationPage.testMessageSent', { preview }),
            'success'
        );
    };

    // Handle horizontal scroll for tabs on mobile
    const handleTabScroll = (e: React.WheelEvent) => {
        if (window.innerWidth < 768) {
            e.currentTarget.scrollLeft += e.deltaY;
        }
    };

    // Rules section handlers
    const handleEscalationEmailChange = (email: string) => {
        handleSettingsChange({
            escalationRules: {
                ...settings.escalationRules!,
                escalationEmail: email
            }
        });
    };

    const handleNotificationPreferenceChange = (type: 'email' | 'sms' | 'push', enabled: boolean) => {
        const newPreferences = {
            ...settings.escalationRules!.notificationPreferences!,
            [type]: enabled
        };
        
        handleSettingsChange({
            escalationRules: {
                ...settings.escalationRules!,
                notificationPreferences: newPreferences
            }
        });
    };

    const timeSaved = calculateTimeSaved();

    // Mobile-optimized business hours component
    const BusinessHoursMobile: React.FC = () => (
        <div className="space-y-3">
            {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => (
                <div key={day} className="p-3 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-600 space-y-3">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.businessHours![day].enabled}
                            onChange={(e) => handleBusinessHoursChange(day, 'enabled', e.target.checked)}
                            className="h-5 w-5 text-brand-blue rounded border-gray-300"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300 capitalize text-base">
                            {t(`days.${day}`)}
                        </span>
                    </label>
                    
                    {settings.businessHours![day].enabled && (
                        <div className="flex space-x-3 pl-8">
                            <TimeInput
                                value={settings.businessHours![day].open}
                                onChange={(value) => handleBusinessHoursChange(day, 'open', value)}
                                label={t('automationPage.businessHours.open')}
                            />
                            <TimeInput
                                value={settings.businessHours![day].close}
                                onChange={(value) => handleBusinessHoursChange(day, 'close', value)}
                                label={t('automationPage.businessHours.close')}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    // Mobile-optimized service filters
    const ServiceFiltersMobile: React.FC = () => (
        <div className="space-y-2">
            {services.map(service => (
                <label key={service.id} className="flex items-center space-x-3 p-2 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-600">
                    <input
                        type="checkbox"
                        checked={settings.serviceTypeFilters!.includes(service.id)}
                        onChange={() => handleServiceTypeToggle(service.id)}
                        className="h-5 w-5 text-brand-blue rounded border-gray-300 flex-shrink-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 text-base flex-1">{service.title}</span>
                </label>
            ))}
        </div>
    );

    const renderMessageCategory = (category: string, messageKeys: string[], title: string) => (
        <div key={category} className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-600 pb-2">
                {title}
            </h3>
            <div className="space-y-4">
                {messageKeys.map(messageKey => (
                    <div key={messageKey} className="p-4 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-600">
                        <div className="flex flex-col space-y-3 mb-3">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                                {t(`automationPage.messageTitles.${messageKey}`, { default: messageKey })}
                            </h4>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setShowMessagePreview(prev => ({
                                        ...prev,
                                        [messageKey]: !prev[messageKey]
                                    }))}
                                    className="flex-1 px-3 py-2 text-sm bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                                    style={{ minHeight: '40px' }}
                                >
                                    {showMessagePreview[messageKey] ? t('automationPage.hidePreview') : t('automationPage.showPreview')}
                                </button>
                                <button
                                    onClick={() => handleTestMessage(messageKey)}
                                    className="flex-1 px-3 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-opacity-90"
                                    style={{ minHeight: '40px' }}
                                >
                                    {t('automationPage.testMessage')}
                                </button>
                            </div>
                        </div>

                        {showMessagePreview[messageKey] && settings.messages[messageKey] && (
                            <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {previewMessage(messageKey, settings.messages[messageKey])}
                                </p>
                            </div>
                        )}

                        <textarea
                            id={`message-${messageKey}`}
                            value={settings.messages[messageKey] || ''}
                            onChange={e => handleMessageChange(messageKey, e.target.value)}
                            rows={4}
                            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base resize-vertical"
                            placeholder={t(`automationPage.messagePlaceholders.${messageKey}`, { 
                                default: defaultMessageTemplates[messageKey as keyof typeof defaultMessageTemplates] 
                            })}
                            maxLength={settings.advancedMessaging?.characterLimit || 160}
                            style={{ minHeight: '100px' }}
                        />
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {t('automationPage.characterCount', {
                                    current: (settings.messages[messageKey] || '').length,
                                    max: settings.advancedMessaging?.characterLimit || 160
                                })}
                            </span>
                            {settings.advancedMessaging?.enableEmojis && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('automationPage.emojisEnabled')} 😊
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="px-4 pt-4">
                <h1 className="text-2xl font-bold dark:text-slate-100">{t('automationPage.title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{t('automationPage.description')}</p>
            </div>

            {/* Mobile-Optimized Navigation Tabs */}
            <div className="border-b dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10 px-4">
                <nav 
                    className="flex space-x-4 overflow-x-auto scrollbar-hide py-2"
                    onWheel={handleTabScroll}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {(['basic', 'messaging', 'rules', 'analytics'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-shrink-0 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === tab
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                            style={{ minWidth: '80px' }}
                        >
                            {t(`automationPage.tabs.${tab}`)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area with Mobile Padding */}
            <div className="px-4 space-y-6">
                {/* Basic Automation Settings */}
                {activeTab === 'basic' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-card dark:border dark:border-slate-700">
                            <h2 className="text-xl font-bold dark:text-slate-100 mb-4">{t('automationPage.autoAccept.title')}</h2>
                            <div className="space-y-4">
                                <ToggleSwitch
                                    checked={settings.autoAccept || false}
                                    onChange={() => handleSettingsChange({ autoAccept: !settings.autoAccept })}
                                    label={t('automationPage.autoAccept.enableLabel')}
                                    description={t('automationPage.autoAccept.enableDescription')}
                                />
                                {settings.autoAccept && (
                                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-fade-in">
                                        <div>
                                            <label htmlFor="autoAcceptMaxPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {t('automationPage.autoAccept.maxPriceLabel')}
                                            </label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                {t('automationPage.autoAccept.maxPriceDescription')}
                                            </p>
                                            <input
                                                type="number"
                                                id="autoAcceptMaxPrice"
                                                value={settings.autoAcceptMaxPrice || 0}
                                                onChange={e => handleSettingsChange({ autoAcceptMaxPrice: Number(e.target.value) })}
                                                min="0"
                                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base"
                                                style={{ minHeight: '44px' }}
                                            />
                                        </div>

                                        {/* Service Type Filters - Mobile Optimized */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t('automationPage.autoAccept.serviceFilters')}
                                            </label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                {t('automationPage.autoAccept.serviceFiltersDescription')}
                                            </p>
                                            <ServiceFiltersMobile />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Business Hours - Mobile Optimized */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-card dark:border dark:border-slate-700">
                            <h2 className="text-xl font-bold dark:text-slate-100 mb-4">{t('automationPage.businessHours.title')}</h2>
                            <div className="space-y-4">
                                <ToggleSwitch
                                    checked={settings.businessHours?.enabled || false}
                                    onChange={() => handleSettingsChange({
                                        businessHours: {
                                            ...settings.businessHours!,
                                            enabled: !settings.businessHours?.enabled
                                        }
                                    })}
                                    label={t('automationPage.businessHours.enableLabel')}
                                    description={t('automationPage.businessHours.enableDescription')}
                                />
                                {settings.businessHours?.enabled && (
                                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-fade-in">
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t('automationPage.businessHours.timezone')}
                                            </label>
                                            <TimezoneSelector
                                                value={settings.businessHours!.timezone}
                                                onChange={(timezone) => handleSettingsChange({
                                                    businessHours: {
                                                        ...settings.businessHours!,
                                                        timezone
                                                    }
                                                })}
                                            />
                                        </div>
                                        
                                        <BusinessHoursMobile />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Messaging Settings - Mobile Optimized */}
                {activeTab === 'messaging' && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-card dark:border dark:border-slate-700">
                        <h2 className="text-xl font-bold dark:text-slate-100 mb-6">{t('automationPage.autoMessages.title')}</h2>
                        <div className="space-y-4">
                            <ToggleSwitch
                                checked={settings.autoMessages || false}
                                onChange={() => handleSettingsChange({ autoMessages: !settings.autoMessages })}
                                label={t('automationPage.autoMessages.enableLabel')}
                                description={t('automationPage.autoMessages.enableDescription')}
                            />
                            {settings.autoMessages && (
                                <div className="space-y-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-fade-in">
                                    {/* Template Tokens - Mobile Grid */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                                            {t('automationPage.templateTokens.title')}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                            {t('automationPage.templateTokens.description')}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                                            {templateTokens.map(({ token, description }) => (
                                                <TemplateToken
                                                    key={token}
                                                    token={token}
                                                    description={description}
                                                    onInsert={(token) => insertToken('', token)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message Categories */}
                                    <div className="space-y-8">
                                        {Object.entries(messageCategories).map(([category, messageKeys]) => (
                                            renderMessageCategory(
                                                category,
                                                messageKeys,
                                                t(`automationPage.messageCategories.${category}`, { default: category })
                                            )
                                        ))}
                                    </div>

                                    {/* Advanced Messaging Options - Mobile Stack */}
                                    <div className="pt-6 border-t dark:border-slate-600">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                                            {t('automationPage.advancedMessaging.title')}
                                        </h3>
                                        <div className="space-y-4">
                                            <ToggleSwitch
                                                checked={settings.advancedMessaging?.enableEmojis || false}
                                                onChange={() => handleSettingsChange({
                                                    advancedMessaging: {
                                                        ...settings.advancedMessaging!,
                                                        enableEmojis: !settings.advancedMessaging?.enableEmojis
                                                }
                                                })}
                                                label={t('automationPage.advancedMessaging.enableEmojis')}
                                                description={t('automationPage.advancedMessaging.enableEmojisDescription')}
                                            />
                                            <ToggleSwitch
                                                checked={settings.advancedMessaging?.enableDeliveryReports || false}
                                                onChange={() => handleSettingsChange({
                                                    advancedMessaging: {
                                                        ...settings.advancedMessaging!,
                                                        enableDeliveryReports: !settings.advancedMessaging?.enableDeliveryReports
                                                }
                                                })}
                                                label={t('automationPage.advancedMessaging.enableDeliveryReports')}
                                                description={t('automationPage.advancedMessaging.enableDeliveryReportsDescription')}
                                            />
                                            <ToggleSwitch
                                                checked={settings.advancedMessaging?.enableAppointmentReminders || false}
                                                onChange={() => handleSettingsChange({
                                                    advancedMessaging: {
                                                        ...settings.advancedMessaging!,
                                                        enableAppointmentReminders: !settings.advancedMessaging?.enableAppointmentReminders
                                                }
                                                })}
                                                label={t('automationPage.advancedMessaging.enableAppointmentReminders')}
                                                description={t('automationPage.advancedMessaging.enableAppointmentRemindersDescription')}
                                            />
                                            <ToggleSwitch
                                                checked={settings.advancedMessaging?.enablePromotionalMessages || false}
                                                onChange={() => handleSettingsChange({
                                                    advancedMessaging: {
                                                        ...settings.advancedMessaging!,
                                                        enablePromotionalMessages: !settings.advancedMessaging?.enablePromotionalMessages
                                                }
                                                })}
                                                label={t('automationPage.advancedMessaging.enablePromotionalMessages')}
                                                description={t('automationPage.advancedMessaging.enablePromotionalMessagesDescription')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Rules & Escalation - COMPLETE SECTION */}
                {activeTab === 'rules' && (
                    <div className="space-y-6">
                        {/* Escalation Rules */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-card dark:border dark:border-slate-700">
                            <h2 className="text-xl font-bold dark:text-slate-100 mb-4">{t('automationPage.escalationRules.title')}</h2>
                            <div className="space-y-6">
                                {/* Failure Notification */}
                                <div className="space-y-4">
                                    <ToggleSwitch
                                        checked={settings.escalationRules?.notifyOnFailure || false}
                                        onChange={() => handleSettingsChange({
                                            escalationRules: {
                                                ...settings.escalationRules!,
                                                notifyOnFailure: !settings.escalationRules?.notifyOnFailure
                                            }
                                        })}
                                        label={t('automationPage.escalationRules.notifyOnFailure')}
                                        description={t('automationPage.escalationRules.notifyOnFailureDescription')}
                                    />
                                    
                                    {settings.escalationRules?.notifyOnFailure && (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-fade-in space-y-4">
                                            <div>
                                                <label htmlFor="escalationEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    {t('automationPage.escalationRules.escalationEmail')}
                                                </label>
                                                <input
                                                    type="email"
                                                    id="escalationEmail"
                                                    value={settings.escalationRules?.escalationEmail || ''}
                                                    onChange={(e) => handleEscalationEmailChange(e.target.value)}
                                                    className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base"
                                                    style={{ minHeight: '44px' }}
                                                    placeholder="manager@example.com"
                                                />
                                            </div>

                                            {/* Notification Preferences */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                                    {t('automationPage.escalationRules.notificationMethods')}
                                                </label>
                                                <div className="space-y-2">
                                                    {(['email', 'sms', 'push'] as const).map(method => (
                                                        <label key={method} className="flex items-center space-x-3 p-2 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-600">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.escalationRules?.notificationPreferences?.[method] || false}
                                                                onChange={(e) => handleNotificationPreferenceChange(method, e.target.checked)}
                                                                className="h-5 w-5 text-brand-blue rounded border-gray-300"
                                                            />
                                                            <span className="text-slate-700 dark:text-slate-300 text-base capitalize">
                                                                {t(`automationPage.escalationRules.${method}`)}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Fallback Action */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <label htmlFor="fallbackAction" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('automationPage.escalationRules.fallbackAction')}
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        {t('automationPage.escalationRules.fallbackActionDescription')}
                                    </p>
                                    <select
                                        id="fallbackAction"
                                        value={settings.escalationRules?.fallbackAction || 'hold_for_review'}
                                        onChange={(e) => handleSettingsChange({
                                            escalationRules: {
                                                ...settings.escalationRules!,
                                                fallbackAction: e.target.value as any
                                            }
                                        })}
                                        className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base"
                                        style={{ minHeight: '44px' }}
                                    >
                                        <option value="hold_for_review">{t('automationPage.escalationRules.holdForReview')}</option>
                                        <option value="notify_manager">{t('automationPage.escalationRules.notifyManager')}</option>
                                        <option value="auto_decline">{t('automationPage.escalationRules.autoDecline')}</option>
                                        <option value="assign_to_staff">{t('automationPage.escalationRules.assignToStaff')}</option>
                                    </select>
                                </div>

                                {/* Retry Settings */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <label htmlFor="maxRetries" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('automationPage.escalationRules.maxRetries')}
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        {t('automationPage.escalationRules.maxRetriesDescription')}
                                    </p>
                                    <input
                                        type="number"
                                        id="maxRetries"
                                        value={settings.escalationRules?.maxRetries || 3}
                                        onChange={(e) => handleSettingsChange({
                                            escalationRules: {
                                                ...settings.escalationRules!,
                                                maxRetries: Number(e.target.value)
                                            }
                                        })}
                                        min="0"
                                        max="10"
                                        className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base"
                                        style={{ minHeight: '44px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Auto-Decline Conditions */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-card dark:border dark:border-slate-700">
                            <h2 className="text-xl font-bold dark:text-slate-100 mb-4">{t('automationPage.autoDecline.title')}</h2>
                            <div className="space-y-4">
                                <ToggleSwitch
                                    checked={settings.escalationRules?.autoDeclineEnabled || false}
                                    onChange={() => handleSettingsChange({
                                        escalationRules: {
                                            ...settings.escalationRules!,
                                            autoDeclineEnabled: !settings.escalationRules?.autoDeclineEnabled
                                        }
                                    })}
                                    label={t('automationPage.autoDecline.enableLabel')}
                                    description={t('automationPage.autoDecline.enableDescription')}
                                />
                                
                                {settings.escalationRules?.autoDeclineEnabled && (
                                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-fade-in">
                                        {/* Price Threshold */}
                                        <div>
                                            <label htmlFor="autoDeclineMaxPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t('automationPage.autoDecline.maxPriceLabel')}
                                            </label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                {t('automationPage.autoDecline.maxPriceDescription')}
                                            </p>
                                            <input
                                                type="number"
                                                id="autoDeclineMaxPrice"
                                                value={settings.escalationRules?.autoDeclineMaxPrice || 0}
                                                onChange={(e) => handleSettingsChange({
                                                    escalationRules: {
                                                        ...settings.escalationRules!,
                                                        autoDeclineMaxPrice: Number(e.target.value)
                                                    }
                                                })}
                                                min="0"
                                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base"
                                                style={{ minHeight: '44px' }}
                                            />
                                        </div>

                                        {/* Delivery Distance */}
                                        <div>
                                            <label htmlFor="autoDeclineMaxDistance" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t('automationPage.autoDecline.maxDistanceLabel')}
                                            </label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                {t('automationPage.autoDecline.maxDistanceDescription')}
                                            </p>
                                            <input
                                                type="number"
                                                id="autoDeclineMaxDistance"
                                                value={settings.escalationRules?.autoDeclineMaxDistance || 0}
                                                onChange={(e) => handleSettingsChange({
                                                    escalationRules: {
                                                        ...settings.escalationRules!,
                                                        autoDeclineMaxDistance: Number(e.target.value)
                                                    }
                                                })}
                                                min="0"
                                                step="0.1"
                                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base"
                                                style={{ minHeight: '44px' }}
                                            />
                                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">miles</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Priority Handling */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-card dark:border dark:border-slate-700">
                            <h2 className="text-xl font-bold dark:text-slate-100 mb-4">{t('automationPage.priorityHandling.title')}</h2>
                            <div className="space-y-4">
                                <ToggleSwitch
                                    checked={settings.escalationRules?.priorityHandling || false}
                                    onChange={() => handleSettingsChange({
                                        escalationRules: {
                                            ...settings.escalationRules!,
                                            priorityHandling: !settings.escalationRules?.priorityHandling
                                        }
                                    })}
                                    label={t('automationPage.priorityHandling.enableLabel')}
                                    description={t('automationPage.priorityHandling.enableDescription')}
                                />
                                
                                {settings.escalationRules?.priorityHandling && (
                                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-fade-in">
                                        {/* VIP Customers */}
                                        <div>
                                            <ToggleSwitch
                                                checked={settings.escalationRules?.priorityVipCustomers || false}
                                                onChange={() => handleSettingsChange({
                                                    escalationRules: {
                                                        ...settings.escalationRules!,
                                                        priorityVipCustomers: !settings.escalationRules?.priorityVipCustomers
                                                    }
                                                })}
                                                label={t('automationPage.priorityHandling.enableVip')}
                                                description={t('automationPage.priorityHandling.enableVipDescription')}
                                            />
                                        </div>

                                        {/* High Value Orders */}
                                        <div>
                                            <label htmlFor="priorityMinOrderValue" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t('automationPage.priorityHandling.minOrderValue')}
                                            </label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                {t('automationPage.priorityHandling.minOrderValueDescription')}
                                            </p>
                                            <input
                                                type="number"
                                                id="priorityMinOrderValue"
                                                value={settings.escalationRules?.priorityMinOrderValue || 0}
                                                onChange={(e) => handleSettingsChange({
                                                    escalationRules: {
                                                        ...settings.escalationRules!,
                                                        priorityMinOrderValue: Number(e.target.value)
                                                    }
                                                })}
                                                min="0"
                                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-base"
                                                style={{ minHeight: '44px' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics - Mobile Optimized Grid */}
                {activeTab === 'analytics' && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-card dark:border dark:border-slate-700">
                        <h2 className="text-xl font-bold dark:text-slate-100 mb-6">{t('automationPage.analytics.title')}</h2>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="text-xl font-bold text-brand-blue">{settings.analytics?.ordersProcessed || 0}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('automationPage.analytics.ordersProcessed')}</div>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="text-xl font-bold text-green-600">{settings.analytics?.messagesSent || 0}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('automationPage.analytics.messagesSent')}</div>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="text-xl font-bold text-orange-600">{timeSaved.weekly.toFixed(1)}h</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('automationPage.analytics.timeSavedWeekly')}</div>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="text-xl font-bold text-purple-600">{settings.analytics?.errorCount || 0}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('automationPage.analytics.errors')}</div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                                {t('automationPage.analytics.efficiencyGains')}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t('automationPage.analytics.weeklyTimeSaved')}</span>
                                    <span className="font-semibold">{timeSaved.weekly.toFixed(1)} hours</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t('automationPage.analytics.monthlyTimeSaved')}</span>
                                    <span className="font-semibold">{timeSaved.monthly.toFixed(1)} hours</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t('automationPage.analytics.successRate')}</span>
                                    <span className="font-semibold text-green-600">
                                        {settings.analytics?.ordersProcessed ? 
                                            `${((1 - (settings.analytics.errorCount / settings.analytics.ordersProcessed)) * 100).toFixed(1)}%` : 
                                            '100%'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Save Button - Mobile Optimized */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-4 shadow-lg">
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="w-full py-4 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 flex items-center justify-center space-x-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors text-base"
                    style={{ minHeight: '52px' }}
                >
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{t('buttons.saving')}</span>
                        </>
                    ) : (
                        <>
                            <Icon name="check" className="w-5 h-5" />
                            <span>{t('profilePage.saveChanges')}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};