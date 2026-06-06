# Schéma de Base de Données - Laundry Express RDC

## Architecture de Base de Données PostgreSQL

### 1. Tables d'Authentification et Utilisateurs

```sql
-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    -- Rôles: customer, partner_owner, partner_staff, driver, logistics_manager, admin, super_admin
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions utilisateur
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tokens de réinitialisation de mot de passe
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions admin
CREATE TABLE admin_permissions (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    can_manage_partners BOOLEAN DEFAULT FALSE,
    can_manage_orders BOOLEAN DEFAULT FALSE,
    can_manage_drivers BOOLEAN DEFAULT FALSE,
    can_manage_payments BOOLEAN DEFAULT FALSE,
    can_manage_content BOOLEAN DEFAULT FALSE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    can_manage_admins BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Tables Clients

```sql
-- Profils clients
CREATE TABLE customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    loyalty_points INTEGER DEFAULT 0,
    referral_code VARCHAR(50) UNIQUE,
    referred_by_code VARCHAR(50),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    preferred_payment_method VARCHAR(50),
    notification_preferences JSONB DEFAULT '{
        "email": true,
        "sms": true,
        "push": true,
        "new_order": true,
        "order_status_change": true,
        "promotions": true
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adresses clients
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL, -- "Maison", "Bureau", etc.
    commune VARCHAR(100) NOT NULL,
    quartier VARCHAR(100),
    avenue VARCHAR(255),
    numero VARCHAR(50),
    reference TEXT,
    coordinates POINT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historique des commandes clients (vue dénormalisée pour performance)
CREATE TABLE customer_order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    partner_name VARCHAR(255),
    service_type VARCHAR(50),
    total_amount DECIMAL(10, 2),
    status VARCHAR(50),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Tables Partenaires

```sql
-- Partenaires (pressings, lavandiers)
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'PRESSING', 'LAVANDIER', 'CORDONNERIE'
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    
    -- Contact
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT NOT NULL,
    commune VARCHAR(100) NOT NULL,
    coordinates POINT,
    
    -- Évaluation
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    
    -- Statut
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, SUSPENDED, REJECTED
    approval_date TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Configuration
    currency VARCHAR(3) DEFAULT 'USD',
    commission_rate DECIMAL(5, 4) DEFAULT 0.15,
    minimum_order_value DECIMAL(10, 2),
    delivery_model VARCHAR(50) DEFAULT 'platform', -- 'platform', 'self'
    
    -- Fonctionnalités activées
    features JSONB DEFAULT '{
        "promotions": false,
        "analytics": false,
        "team_management": false,
        "api_access": false,
        "automation": false,
        "invoice_generator": false
    }',
    
    -- Métadonnées
    image_urls TEXT[],
    description TEXT,
    operating_hours JSONB,
    unavailability_periods JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents partenaires
CREATE TABLE partner_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'REGISTRATION', 'TAX_CERTIFICATE', 'INSURANCE', 'LICENSE'
    file_url TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Équipe partenaire
CREATE TABLE partner_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'owner', 'manager', 'staff'
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ
);

-- Zones de livraison partenaire
CREATE TABLE partner_delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    commune VARCHAR(100) NOT NULL,
    fee DECIMAL(10, 2) DEFAULT 0,
    min_order_value DECIMAL(10, 2),
    estimated_delivery_time INTEGER, -- en minutes
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Tables Services et Tarification

```sql
-- Catégories de services
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_name VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES service_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_model VARCHAR(50) NOT NULL, -- 'per_item', 'per_kg', 'fixed'
    base_price DECIMAL(10, 2),
    unit VARCHAR(50), -- 'piece', 'kg', 'item'
    estimated_time INTEGER, -- en minutes
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles (items spécifiques)
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prix par partenaire
CREATE TABLE partner_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    article_id UUID REFERENCES articles(id),
    price DECIMAL(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(partner_id, COALESCE(service_id, '00000000-0000-0000-0000-000000000000'), 
           COALESCE(article_id, '00000000-0000-0000-0000-000000000000'))
);

-- Inventaire partenaire
CREATE TABLE partner_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- 'kg', 'liters', 'units', 'pcs'
    current_stock DECIMAL(10, 2) DEFAULT 0,
    low_stock_threshold DECIMAL(10, 2),
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Tables Commandes

```sql
-- Commandes
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Format: ORD-YYYYMMDD-XXXXX
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    
    -- Adresses
    pickup_address_id UUID REFERENCES customer_addresses(id),
    delivery_address_id UUID REFERENCES customer_addresses(id),
    pickup_coordinates POINT,
    delivery_coordinates POINT,
    
    -- Horaires
    pickup_time TIMESTAMPTZ NOT NULL,
    delivery_time TIMESTAMPTZ,
    estimated_completion_time TIMESTAMPTZ,
    
    -- Statut
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    -- Statuts: DRAFT, PENDING_CONFIRMATION, CONFIRMED, PICKUP_SCHEDULED, 
    -- DRIVER_ASSIGNED_FOR_PICKUP, PICKED_UP, RECEIVED_BY_PARTNER,
    -- IN_CLEANING, READY_FOR_DELIVERY, DRIVER_ASSIGNED_FOR_DELIVERY,
    -- OUT_FOR_DELIVERY, DELIVERED, COMPLETED, CANCELLED, REJECTED
    
    -- Prix
    subtotal DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Métadonnées
    special_instructions TEXT,
    rejection_reason TEXT,
    cancellation_reason TEXT,
    
    -- Timestamps
    confirmed_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de commande
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id),
    service_id UUID REFERENCES services(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    weight DECIMAL(5, 2), -- en kg, si applicable
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historique des statuts de commande
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Événements de commande (pour event-driven architecture)
CREATE TABLE order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Tables Logistique et Chauffeurs

```sql
-- Chauffeurs
CREATE TABLE drivers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partners(id), -- Si chauffeur interne partenaire
    logistics_partner_id UUID, -- Référence à un partenaire logistique
    vehicle_type VARCHAR(50),
    vehicle_plate VARCHAR(50),
    vehicle_capacity DECIMAL(5, 2), -- en kg
    current_location POINT,
    status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, UNAVAILABLE, ON_MISSION
    rating DECIMAL(3, 2) DEFAULT 0,
    total_missions INTEGER DEFAULT 0,
    completed_missions INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions de livraison
CREATE TABLE delivery_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(user_id),
    mission_type VARCHAR(50) NOT NULL, -- 'PICKUP', 'DELIVERY'
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    pickup_address TEXT,
    delivery_address TEXT,
    pickup_coordinates POINT,
    delivery_coordinates POINT,
    scheduled_time TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_duration INTEGER, -- en minutes
    actual_duration INTEGER,
    distance DECIMAL(6, 2), -- en km
    proof_images TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historique des positions chauffeur
CREATE TABLE driver_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(user_id) ON DELETE CASCADE,
    mission_id UUID REFERENCES delivery_missions(id),
    coordinates POINT NOT NULL,
    accuracy DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    battery_level INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disponibilité chauffeur
CREATE TABLE driver_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(user_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(driver_id, day_of_week)
);
```

### 7. Tables Paiements

```sql
-- Intentions de paiement
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED
    payment_method VARCHAR(50), -- 'CASH', 'MOBILE_MONEY', 'CARD'
    provider VARCHAR(50), -- 'MPESA', 'AIRTEL_MONEY', 'ORANGE_MONEY', 'STRIPE'
    provider_reference VARCHAR(255),
    metadata JSONB,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
    provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255),
    provider_response JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remboursements
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    amount DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, PROCESSED
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. Tables Notifications et Communication

```sql
-- Modèles de notification
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP'
    event_type VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    body_template TEXT NOT NULL,
    variables TEXT[], -- Variables disponibles dans le template
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id),
    channel VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, FAILED
    metadata JSONB,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat entre utilisateurs
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    is_group_chat BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants au chat
CREATE TABLE chat_participants (
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    PRIMARY KEY (chat_id, user_id)
);

-- Messages de chat
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'TEXT', -- TEXT, IMAGE, FILE, SYSTEM
    metadata JSONB,
    read_by JSONB DEFAULT '[]', -- Liste des IDs des utilisateurs qui ont lu le message
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets de support
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- BILLING, DELIVERY, QUALITY, ACCOUNT, OTHER
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    priority VARCHAR(50) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    assigned_to UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages de support
CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9. Tables Marketing et Promotion

```sql
-- Codes promotionnels
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL, -- 'PERCENTAGE', 'FIXED_AMOUNT'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2),
    max_uses INTEGER,
    uses_per_customer INTEGER DEFAULT 1,
    partner_id UUID REFERENCES partners(id),
    applicable_service_ids UUID[],
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Utilisation des codes promo
CREATE TABLE promo_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discount_applied DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programme de fidélité
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- EARNED, REDEEMED, EXPIRED, ADJUSTMENT
    description TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programme de parrainage
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    referrer_code_used VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, EXPIRED
    referrer_reward_points INTEGER,
    referee_discount_amount DECIMAL(10, 2),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10. Tables Analytics et Administration

```sql
-- Logs d'activité
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Métriques analytiques
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    partner_id UUID REFERENCES partners(id),
    value DECIMAL(15, 2) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(metric_date, metric_type, partner_id)
);

-- Webhooks pour intégrations partenaires
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret VARCHAR(255),
    events TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs de webhooks
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration système
CREATE TABLE system_configurations (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11. Indexes Recommandés

```sql
-- Index pour performances critiques
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_partner_id ON orders(partner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at DESC);

CREATE INDEX idx_delivery_missions_order_id ON delivery_missions(order_id);
CREATE INDEX idx_delivery_missions_driver_id ON delivery_missions(driver_id);
CREATE INDEX idx_delivery_missions_status ON delivery_missions(status);

CREATE INDEX idx_payment_intents_order_id ON payment_intents(order_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

CREATE INDEX idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Index pour recherches textuelles
CREATE INDEX idx_partners_name ON partners USING gin(to_tsvector('french', name));
CREATE INDEX idx_articles_name ON articles USING gin(to_tsvector('french', name));
```

### 12. Vues Utiles

```sql
-- Vue pour dashboard admin
CREATE VIEW admin_dashboard_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
    SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as revenue,
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(DISTINCT partner_id) as active_partners
FROM orders
GROUP BY DATE(created_at);

-- Vue pour performance partenaire
CREATE VIEW partner_performance AS
SELECT 
    p.id as partner_id,
    p.name as partner_name,
    p.type as partner_type,
    COUNT(o.id) as total_orders,
    COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_orders,
    AVG(o.rating) as average_rating,
    SUM(o.total_amount) as total_revenue,
    AVG(EXTRACT(EPOCH FROM (o.completed_at - o.confirmed_at))/3600) as avg_processing_hours
FROM partners p
LEFT JOIN orders o ON p.id = o.partner_id
GROUP BY p.id, p.name, p.type;

-- Vue pour suivi chauffeur
CREATE VIEW driver_performance AS
SELECT 
    d.user_id as driver_id,
    u.name as driver_name,
    COUNT(DISTINCT dm.id) as total_missions,
    COUNT(CASE WHEN dm.status = 'COMPLETED' THEN 1 END) as completed_missions,
    AVG(dm.actual_duration) as avg_mission_duration,
    SUM(dm.distance) as total_distance_km,
    AVG(d.rating) as average_rating
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN delivery_missions dm ON d.user_id = dm.driver_id
GROUP BY d.user_id, u.name;
```

### 13. Triggers et Fonctions

```sql
-- Fonction pour générer le numéro de commande
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || 
                       TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' ||
                       LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer le numéro de commande
CREATE TRIGGER trg_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER trg_update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_partners_updated_at
BEFORE UPDATE ON partners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour journaliser les changements de statut
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, status, changed_by, notes)
        VALUES (NEW.id, NEW.status, current_setting('app.user_id', TRUE)::UUID, 
                'Status changed from ' || OLD.status || ' to ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour journaliser les changements de statut
CREATE TRIGGER trg_log_order_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();
```

## Résumé du Schéma

### Statistiques du Schéma
- **Total Tables:** 35 tables principales
- **Relations:** 50+ relations clés étrangères
- **Index:** 20+ indexes pour performance
- **Vues:** 3 vues analytiques
- **Triggers:** 4 triggers automatiques

### Domaines Couverts
1. **Authentification & Utilisateurs** (4 tables)
2. **Clients & Profils** (3 tables)
3. **Partenaires & Services** (8 tables)
4. **Commandes & Logistique** (8 tables)
5. **Paiements & Transactions** (4 tables)
6. **Notifications & Communication** (6 tables)
7. **Marketing & Promotion** (4 tables)
8. **Analytics & Administration** (5 tables)

### Points Clés de Conception
- **UUIDs** pour toutes les clés primaires
- **Timestamps** automatiques (created_at, updated_at)
- **Soft deletes** via is_active/is_deleted
- **JSONB** pour données flexibles
- **Indexes stratégiques** pour performances
- **Triggers** pour automatisation
- **Vues** pour reporting

Ce schéma est prêt pour la production et supporte toutes les fonctionnalités de Laundry Express RDC avec une architecture scalable et maintenable.
