"""create_payment_dispute_commission_tables

Revision ID: 88e66e4b89ee
Revises: hybrid_dispatch_marketplace
Create Date: 2026-03-15 18:44:58.802969

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = '88e66e4b89ee'
down_revision = 'hybrid_dispatch_marketplace'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ========== PAYMENT TABLES ==========
    
    # Vérifier si la table payment_intents existe déjà
    conn = op.get_bind()
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'payment_intents'
        )
    """))
    payment_intents_exists = result.scalar()
    
    if not payment_intents_exists:
        # Payment Intents
        op.create_table('payment_intents',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('payment_method', sa.String(length=50), nullable=False),
            sa.Column('currency', sa.String(length=3), nullable=False, default='CDF'),
            sa.Column('amount_expected', sa.Float(), nullable=False),
            sa.Column('amount_paid', sa.Float(), nullable=False, default=0.0),
            sa.Column('status', sa.String(length=50), nullable=False, default='created'),
            sa.Column('provider_name', sa.String(length=50), nullable=True),
            sa.Column('provider_reference', sa.String(length=255), nullable=True),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('payment_metadata', sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('provider_reference')
        )
        op.create_index(op.f('ix_payment_intents_customer_id'), 'payment_intents', ['customer_id'], unique=False)
        op.create_index(op.f('ix_payment_intents_order_id'), 'payment_intents', ['order_id'], unique=False)
    
    # Vérifier si la table payment_transactions existe déjà
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'payment_transactions'
        )
    """))
    payment_transactions_exists = result.scalar()
    
    if not payment_transactions_exists:
        # Payment Transactions
        op.create_table('payment_transactions',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('payment_intent_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('transaction_type', sa.String(length=50), nullable=False),
            sa.Column('provider_name', sa.String(length=50), nullable=True),
            sa.Column('provider_transaction_id', sa.String(length=255), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=False, default='initiated'),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('currency', sa.String(length=3), nullable=False, default='CDF'),
            sa.Column('raw_provider_payload', sa.Text(), nullable=True),
            sa.Column('failure_reason', sa.Text(), nullable=True),
            sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
            sa.ForeignKeyConstraint(['payment_intent_id'], ['payment_intents.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('provider_transaction_id')
        )
        op.create_index(op.f('ix_payment_transactions_order_id'), 'payment_transactions', ['order_id'], unique=False)
        op.create_index(op.f('ix_payment_transactions_payment_intent_id'), 'payment_transactions', ['payment_intent_id'], unique=False)
    
    # Vérifier si la table payment_provider_events existe déjà
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'payment_provider_events'
        )
    """))
    payment_provider_events_exists = result.scalar()
    
    if not payment_provider_events_exists:
        # Payment Provider Events
        op.create_table('payment_provider_events',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('payment_intent_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('event_type', sa.String(length=100), nullable=False),
            sa.Column('event_data', sa.Text(), nullable=False),
            sa.Column('provider', sa.String(length=50), nullable=False),
            sa.Column('provider_event_id', sa.String(length=255), nullable=True),
            sa.ForeignKeyConstraint(['payment_intent_id'], ['payment_intents.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('provider_event_id')
        )
        op.create_index(op.f('ix_payment_provider_events_payment_intent_id'), 'payment_provider_events', ['payment_intent_id'], unique=False)
    
    # ========== DISPUTE TABLES ==========
    
    # Vérifier si la table disputes existe déjà
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'disputes'
        )
    """))
    disputes_exists = result.scalar()
    
    if not disputes_exists:
        # Disputes
        op.create_table('disputes',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('partner_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('category', sa.String(length=50), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False, default='open'),
            sa.Column('priority', sa.String(length=20), nullable=False, default='medium'),
            sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('resolution_notes', sa.Text(), nullable=True),
            sa.Column('resolved_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
            sa.ForeignKeyConstraint(['partner_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['resolved_by_user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_disputes_customer_id'), 'disputes', ['customer_id'], unique=False)
        op.create_index(op.f('ix_disputes_order_id'), 'disputes', ['order_id'], unique=False)
        op.create_index(op.f('ix_disputes_partner_id'), 'disputes', ['partner_id'], unique=False)
    
    # ========== COMMISSION TABLES ==========
    
    # Vérifier si la table commission_records existe déjà
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'commission_records'
        )
    """))
    commission_records_exists = result.scalar()
    
    if not commission_records_exists:
        # Commission Records
        op.create_table('commission_records',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('partner_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('gross_amount', sa.Float(), nullable=False),
            sa.Column('platform_commission_rate', sa.Float(), nullable=False),
            sa.Column('platform_commission_amount', sa.Float(), nullable=False),
            sa.Column('partner_net_amount', sa.Float(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False, default='pending'),
            sa.Column('computed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('settlement_notes', sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
            sa.ForeignKeyConstraint(['partner_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_commission_records_order_id'), 'commission_records', ['order_id'], unique=False)
        op.create_index(op.f('ix_commission_records_partner_id'), 'commission_records', ['partner_id'], unique=False)
    
    # ========== REFUND TABLES ==========
    
    # Vérifier si la table refund_requests existe déjà
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'refund_requests'
        )
    """))
    refund_requests_exists = result.scalar()
    
    if not refund_requests_exists:
        # Refund Requests
        op.create_table('refund_requests',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('payment_intent_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('dispute_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('reason_code', sa.String(length=50), nullable=False),
            sa.Column('reason_text', sa.Text(), nullable=True),
            sa.Column('requested_amount', sa.Float(), nullable=False),
            sa.Column('approved_amount', sa.Float(), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=False, default='requested'),
            sa.Column('reviewed_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['dispute_id'], ['disputes.id'], ),
            sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
            sa.ForeignKeyConstraint(['payment_intent_id'], ['payment_intents.id'], ),
            sa.ForeignKeyConstraint(['reviewed_by_user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_refund_requests_customer_id'), 'refund_requests', ['customer_id'], unique=False)
        op.create_index(op.f('ix_refund_requests_dispute_id'), 'refund_requests', ['dispute_id'], unique=False)
        op.create_index(op.f('ix_refund_requests_order_id'), 'refund_requests', ['order_id'], unique=False)
        op.create_index(op.f('ix_refund_requests_payment_intent_id'), 'refund_requests', ['payment_intent_id'], unique=False)
    
    # Vérifier si la table refund_transactions existe déjà
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'refund_transactions'
        )
    """))
    refund_transactions_exists = result.scalar()
    
    if not refund_transactions_exists:
        # Refund Transactions
        op.create_table('refund_transactions',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('refund_request_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('payment_intent_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('provider_name', sa.String(length=50), nullable=True),
            sa.Column('provider_refund_id', sa.String(length=255), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=False, default='pending'),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('failure_reason', sa.Text(), nullable=True),
            sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['payment_intent_id'], ['payment_intents.id'], ),
            sa.ForeignKeyConstraint(['refund_request_id'], ['refund_requests.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('provider_refund_id')
        )
        op.create_index(op.f('ix_refund_transactions_payment_intent_id'), 'refund_transactions', ['payment_intent_id'], unique=False)
        op.create_index(op.f('ix_refund_transactions_refund_request_id'), 'refund_transactions', ['refund_request_id'], unique=False)
    
    # ========== ADD PAYMENT STATUS TO ORDERS ==========
    
    # Vérifier si la colonne payment_status existe déjà
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'payment_status'
        )
    """))
    payment_status_exists = result.scalar()
    
    if not payment_status_exists:
        # Ajouter la colonne payment_status à la table orders
        op.add_column('orders', sa.Column('payment_status', sa.String(length=50), nullable=True, default='pending'))
        op.execute(text("UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL"))
        op.alter_column('orders', 'payment_status', nullable=False)
    
    # Vérifier si la colonne amount_paid existe déjà
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'amount_paid'
        )
    """))
    amount_paid_exists = result.scalar()
    
    if not amount_paid_exists:
        # Ajouter la colonne amount_paid à la table orders
        op.add_column('orders', sa.Column('amount_paid', sa.Float(), nullable=True, default=0.0))
        op.execute(text("UPDATE orders SET amount_paid = 0.0 WHERE amount_paid IS NULL"))
        op.alter_column('orders', 'amount_paid', nullable=False)


def downgrade() -> None:
    # Supprimer les colonnes ajoutées à orders
    op.drop_column('orders', 'amount_paid')
    op.drop_column('orders', 'payment_status')
    
    # Supprimer les tables dans l'ordre inverse des dépendances
    op.drop_index(op.f('ix_refund_transactions_refund_request_id'), table_name='refund_transactions')
    op.drop_index(op.f('ix_refund_transactions_payment_intent_id'), table_name='refund_transactions')
    op.drop_table('refund_transactions')
    
    op.drop_index(op.f('ix_refund_requests_payment_intent_id'), table_name='refund_requests')
    op.drop_index(op.f('ix_refund_requests_order_id'), table_name='refund_requests')
    op.drop_index(op.f('ix_refund_requests_dispute_id'), table_name='refund_requests')
    op.drop_index(op.f('ix_refund_requests_customer_id'), table_name='refund_requests')
    op.drop_table('refund_requests')
    
    op.drop_index(op.f('ix_commission_records_partner_id'), table_name='commission_records')
    op.drop_index(op.f('ix_commission_records_order_id'), table_name='commission_records')
    op.drop_table('commission_records')
    
    op.drop_index(op.f('ix_disputes_partner_id'), table_name='disputes')
    op.drop_index(op.f('ix_disputes_order_id'), table_name='disputes')
    op.drop_index(op.f('ix_disputes_customer_id'), table_name='disputes')
    op.drop_table('disputes')
    
    op.drop_index(op.f('ix_payment_provider_events_payment_intent_id'), table_name='payment_provider_events')
    op.drop_table('payment_provider_events')
    
    op.drop_index(op.f('ix_payment_transactions_payment_intent_id'), table_name='payment_transactions')
    op.drop_index(op.f('ix_payment_transactions_order_id'), table_name='payment_transactions')
    op.drop_table('payment_transactions')
    
    op.drop_index(op.f('ix_payment_intents_order_id'), table_name='payment_intents')
    op.drop_index(op.f('ix_payment_intents_customer_id'), table_name='payment_intents')
    op.drop_table('payment_intents')
