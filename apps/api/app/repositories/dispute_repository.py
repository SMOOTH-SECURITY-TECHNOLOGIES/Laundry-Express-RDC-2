from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc

from app.models.dispute import Dispute, DisputeStatus


class DisputeRepository:
    """Repository pour la gestion des litiges"""

    def __init__(self, db: Session):
        self.db = db

    # ========== DISPUTES ==========

    def get_by_id(self, dispute_id: UUID) -> Optional[Dispute]:
        """Obtenir un litige par son ID"""
        return self.db.query(Dispute).filter(
            Dispute.id == dispute_id
        ).options(
            joinedload(Dispute.refund_requests)
        ).first()

    def get_active_dispute_for_order(self, order_id: UUID) -> Optional[Dispute]:
        """Obtenir le litige actif pour une commande"""
        return self.db.query(Dispute).filter(
            and_(
                Dispute.order_id == order_id,
                Dispute.status.in_([
                    DisputeStatus.OPEN,
                    DisputeStatus.UNDER_REVIEW,
                ])
            )
        ).first()

    def get_disputes_for_order(self, order_id: UUID) -> List[Dispute]:
        """Obtenir tous les litiges pour une commande"""
        return self.db.query(Dispute).filter(
            Dispute.order_id == order_id
        ).order_by(desc(Dispute.created_at)).all()

    def get_disputes_for_customer(self, customer_id: UUID, limit: int = 100) -> List[Dispute]:
        """Obtenir les litiges d'un client"""
        return self.db.query(Dispute).filter(
            Dispute.customer_id == customer_id
        ).order_by(desc(Dispute.created_at)).limit(limit).all()

    def get_disputes_for_partner(self, partner_id: UUID, limit: int = 100) -> List[Dispute]:
        """Obtenir les litiges d'un partenaire"""
        return self.db.query(Dispute).filter(
            Dispute.partner_id == partner_id
        ).order_by(desc(Dispute.created_at)).limit(limit).all()

    def get_open_disputes(self, limit: int = 50) -> List[Dispute]:
        """Obtenir les litiges ouverts"""
        return self.db.query(Dispute).filter(
            Dispute.status == DisputeStatus.OPEN
        ).order_by(Dispute.created_at).limit(limit).all()

    def get_under_review_disputes(self, limit: int = 50) -> List[Dispute]:
        """Obtenir les litiges en cours de revue"""
        return self.db.query(Dispute).filter(
            Dispute.status == DisputeStatus.UNDER_REVIEW
        ).order_by(Dispute.created_at).limit(limit).all()

    def create_dispute(self, dispute: Dispute) -> Dispute:
        """Créer un litige"""
        self.db.add(dispute)
        self.db.commit()
        self.db.refresh(dispute)
        return dispute

    def update_dispute(self, dispute: Dispute) -> Dispute:
        """Mettre à jour un litige"""
        dispute.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(dispute)
        return dispute

    # ========== STATISTIQUES ==========

    def get_dispute_stats_for_period(self, start_date: datetime, end_date: datetime) -> dict:
        """Obtenir des statistiques de litiges pour une période"""
        # Litiges créés
        created_disputes = self.db.query(Dispute).filter(
            and_(
                Dispute.created_at >= start_date,
                Dispute.created_at <= end_date
            )
        ).count()

        # Litiges résolus
        resolved_disputes = self.db.query(Dispute).filter(
            and_(
                Dispute.status == DisputeStatus.RESOLVED,
                Dispute.resolved_at >= start_date,
                Dispute.resolved_at <= end_date
            )
        ).count()

        # Litiges rejetés
        rejected_disputes = self.db.query(Dispute).filter(
            and_(
                Dispute.status == DisputeStatus.REJECTED,
                Dispute.resolved_at >= start_date,
                Dispute.resolved_at <= end_date
            )
        ).count()

        # Temps moyen de résolution
        resolved_disputes_list = self.db.query(Dispute).filter(
            and_(
                Dispute.status == DisputeStatus.RESOLVED,
                Dispute.resolved_at >= start_date,
                Dispute.resolved_at <= end_date,
                Dispute.created_at.isnot(None),
                Dispute.resolved_at.isnot(None)
            )
        ).all()

        resolution_times = []
        for dispute in resolved_disputes_list:
            if dispute.created_at and dispute.resolved_at:
                resolution_time = (dispute.resolved_at - dispute.created_at).total_seconds() / 3600  # en heures
                resolution_times.append(resolution_time)

        average_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0

        # Distribution par catégorie
        category_counts = {}
        disputes_by_category = self.db.query(Dispute.category).filter(
            and_(
                Dispute.created_at >= start_date,
                Dispute.created_at <= end_date
            )
        ).all()
        
        for category in disputes_by_category:
            cat = category[0]
            category_counts[cat] = category_counts.get(cat, 0) + 1

        return {
            "created_disputes": created_disputes,
            "resolved_disputes": resolved_disputes,
            "rejected_disputes": rejected_disputes,
            "resolution_rate": (resolved_disputes / created_disputes * 100) if created_disputes > 0 else 0,
            "rejection_rate": (rejected_disputes / created_disputes * 100) if created_disputes > 0 else 0,
            "average_resolution_time_hours": average_resolution_time,
            "by_category": category_counts,
        }

    def get_dispute_summary(self) -> dict:
        """Obtenir un résumé des litiges"""
        total_disputes = self.db.query(Dispute).count()
        open_disputes = self.db.query(Dispute).filter(
            Dispute.status == DisputeStatus.OPEN
        ).count()
        under_review = self.db.query(Dispute).filter(
            Dispute.status == DisputeStatus.UNDER_REVIEW
        ).count()
        resolved_disputes = self.db.query(Dispute).filter(
            Dispute.status == DisputeStatus.RESOLVED
        ).count()

        # Distribution par catégorie
        category_counts = {}
        all_categories = self.db.query(Dispute.category).all()
        for category in all_categories:
            cat = category[0]
            category_counts[cat] = category_counts.get(cat, 0) + 1

        return {
            "total_disputes": total_disputes,
            "open_disputes": open_disputes,
            "under_review": under_review,
            "resolved_disputes": resolved_disputes,
            "by_category": category_counts,
        }