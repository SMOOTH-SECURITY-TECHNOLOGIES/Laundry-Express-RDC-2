from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc

from app.models.commission import CommissionRecord, CommissionStatus


class CommissionRepository:
    """Repository pour la gestion des commissions"""

    def __init__(self, db: Session):
        self.db = db

    # ========== COMMISSION RECORDS ==========

    def get_by_id(self, commission_id: UUID) -> Optional[CommissionRecord]:
        """Obtenir un enregistrement de commission par son ID"""
        return self.db.query(CommissionRecord).filter(
            CommissionRecord.id == commission_id
        ).first()

    def get_commission_for_order(self, order_id: UUID) -> Optional[CommissionRecord]:
        """Obtenir la commission pour une commande"""
        return self.db.query(CommissionRecord).filter(
            CommissionRecord.order_id == order_id
        ).first()

    def get_commissions_for_partner(self, partner_id: UUID, limit: int = 100) -> List[CommissionRecord]:
        """Obtenir les commissions d'un partenaire"""
        return self.db.query(CommissionRecord).filter(
            CommissionRecord.partner_id == partner_id
        ).order_by(desc(CommissionRecord.created_at)).limit(limit).all()

    def get_pending_commissions_for_partner(self, partner_id: UUID) -> List[CommissionRecord]:
        """Obtenir les commissions en attente d'un partenaire"""
        return self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.partner_id == partner_id,
                CommissionRecord.status == CommissionStatus.PENDING
            )
        ).order_by(CommissionRecord.created_at).all()

    def get_computed_commissions_for_partner(self, partner_id: UUID) -> List[CommissionRecord]:
        """Obtenir les commissions calculées d'un partenaire"""
        return self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.partner_id == partner_id,
                CommissionRecord.status == CommissionStatus.COMPUTED
            )
        ).order_by(CommissionRecord.computed_at).all()

    def get_settled_commissions_for_partner(self, partner_id: UUID) -> List[CommissionRecord]:
        """Obtenir les commissions réglées d'un partenaire"""
        return self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.partner_id == partner_id,
                CommissionRecord.status == CommissionStatus.SETTLED
            )
        ).order_by(desc(CommissionRecord.updated_at)).all()

    def get_pending_commissions(self, limit: int = 50) -> List[CommissionRecord]:
        """Obtenir toutes les commissions en attente"""
        return self.db.query(CommissionRecord).filter(
            CommissionRecord.status == CommissionStatus.PENDING
        ).order_by(CommissionRecord.created_at).limit(limit).all()

    def get_computed_commissions(self, limit: int = 50) -> List[CommissionRecord]:
        """Obtenir toutes les commissions calculées"""
        return self.db.query(CommissionRecord).filter(
            CommissionRecord.status == CommissionStatus.COMPUTED
        ).order_by(CommissionRecord.computed_at).limit(limit).all()

    def create_commission(self, commission: CommissionRecord) -> CommissionRecord:
        """Créer un enregistrement de commission"""
        self.db.add(commission)
        self.db.commit()
        self.db.refresh(commission)
        return commission

    def update_commission(self, commission: CommissionRecord) -> CommissionRecord:
        """Mettre à jour un enregistrement de commission"""
        commission.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(commission)
        return commission

    # ========== STATISTIQUES ==========

    def get_commission_summary_for_partner(self, partner_id: UUID) -> dict:
        """Obtenir un résumé des commissions pour un partenaire"""
        # Total brut
        total_gross = self.db.query(CommissionRecord).filter(
            CommissionRecord.partner_id == partner_id
        ).with_entities(CommissionRecord.gross_amount).all()
        total_gross_amount = sum([r[0] for r in total_gross]) if total_gross else 0.0

        # Total commission plateforme
        total_platform_commission = self.db.query(CommissionRecord).filter(
            CommissionRecord.partner_id == partner_id
        ).with_entities(CommissionRecord.platform_commission_amount).all()
        total_platform_commission_amount = sum([r[0] for r in total_platform_commission]) if total_platform_commission else 0.0

        # Total net partenaire
        total_partner_net = self.db.query(CommissionRecord).filter(
            CommissionRecord.partner_id == partner_id
        ).with_entities(CommissionRecord.partner_net_amount).all()
        total_partner_net_amount = sum([r[0] for r in total_partner_net]) if total_partner_net else 0.0

        # Par statut
        pending_commissions = self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.partner_id == partner_id,
                CommissionRecord.status == CommissionStatus.PENDING
            )
        ).count()

        computed_commissions = self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.partner_id == partner_id,
                CommissionRecord.status == CommissionStatus.COMPUTED
            )
        ).count()

        settled_commissions = self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.partner_id == partner_id,
                CommissionRecord.status == CommissionStatus.SETTLED
            )
        ).count()

        # Montants par statut
        pending_amount = sum(
            r.partner_net_amount for r in 
            self.db.query(CommissionRecord).filter(
                and_(
                    CommissionRecord.partner_id == partner_id,
                    CommissionRecord.status == CommissionStatus.PENDING
                )
            ).all()
        )

        computed_amount = sum(
            r.partner_net_amount for r in 
            self.db.query(CommissionRecord).filter(
                and_(
                    CommissionRecord.partner_id == partner_id,
                    CommissionRecord.status == CommissionStatus.COMPUTED
                )
            ).all()
        )

        settled_amount = sum(
            r.partner_net_amount for r in 
            self.db.query(CommissionRecord).filter(
                and_(
                    CommissionRecord.partner_id == partner_id,
                    CommissionRecord.status == CommissionStatus.SETTLED
                )
            ).all()
        )

        return {
            "partner_id": partner_id,
            "total_gross_amount": total_gross_amount,
            "total_platform_commission": total_platform_commission_amount,
            "total_partner_net_amount": total_partner_net_amount,
            "pending_commissions": pending_commissions,
            "computed_commissions": computed_commissions,
            "settled_commissions": settled_commissions,
            "pending_amount": pending_amount,
            "computed_amount": computed_amount,
            "settled_amount": settled_amount,
            "total_orders": pending_commissions + computed_commissions + settled_commissions,
        }

    def get_commission_stats_for_period(self, start_date: datetime, end_date: datetime) -> dict:
        """Obtenir des statistiques de commission pour une période"""
        # Commissions créées
        created_commissions = self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.created_at >= start_date,
                CommissionRecord.created_at <= end_date
            )
        ).count()

        # Commissions calculées
        computed_commissions = self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.status == CommissionStatus.COMPUTED,
                CommissionRecord.computed_at >= start_date,
                CommissionRecord.computed_at <= end_date
            )
        ).count()

        # Commissions réglées
        settled_commissions = self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.status == CommissionStatus.SETTLED,
                CommissionRecord.updated_at >= start_date,
                CommissionRecord.updated_at <= end_date
            )
        ).count()

        # Montants
        computed_records = self.db.query(CommissionRecord).filter(
            and_(
                CommissionRecord.status == CommissionStatus.COMPUTED,
                CommissionRecord.computed_at >= start_date,
                CommissionRecord.computed_at <= end_date
            )
        ).all()

        total_gross = sum(r.gross_amount for r in computed_records)
        total_platform_commission = sum(r.platform_commission_amount for r in computed_records)
        total_partner_net = sum(r.partner_net_amount for r in computed_records)

        # Taux de commission moyen
        avg_commission_rate = 0
        if total_gross > 0:
            avg_commission_rate = (total_platform_commission / total_gross) * 100

        return {
            "created_commissions": created_commissions,
            "computed_commissions": computed_commissions,
            "settled_commissions": settled_commissions,
            "total_gross_amount": total_gross,
            "total_platform_commission": total_platform_commission,
            "total_partner_net_amount": total_partner_net,
            "average_commission_rate_percent": avg_commission_rate,
            "computation_rate": (computed_commissions / created_commissions * 100) if created_commissions > 0 else 0,
            "settlement_rate": (settled_commissions / computed_commissions * 100) if computed_commissions > 0 else 0,
        }