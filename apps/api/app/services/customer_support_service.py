import json
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.exceptions import ValidationError
from app.models.order import Order
from app.models.support import (
    SupportMessage,
    SupportTicket,
    SupportTicketAttachment,
    TicketPriority,
    TicketStatus,
)
from app.models.user import User, UserRole
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService


class CustomerSupportService:
    """Corridor client : tickets de support avec preuves et lien commande."""

    def __init__(self, db: Session):
        self.db = db

    def _resolve_order_context(
        self,
        customer_id: UUID,
        order_id: Optional[UUID],
    ) -> tuple[Optional[UUID], Optional[UUID], Optional[Order]]:
        if order_id is None:
            return None, None, None

        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValidationError("Commande introuvable")
        if str(order.customer_id) != str(customer_id):
            raise ValidationError("Vous n'êtes pas propriétaire de cette commande")

        return order_id, order.partner_id, order

    def create_ticket(self, customer_id: UUID, data: dict) -> SupportTicket:
        order_id, partner_id, _ = self._resolve_order_context(customer_id, data.get("order_id"))

        priority = (data.get("priority") or TicketPriority.MEDIUM.value).lower()
        if priority == "critical":
            priority = TicketPriority.URGENT.value

        ticket = SupportTicket(
            user_id=customer_id,
            title=data["title"],
            description=data["description"],
            status=TicketStatus.OPEN.value,
            priority=priority,
            category=data.get("category"),
            order_id=order_id,
            partner_id=partner_id,
        )
        self.db.add(ticket)
        self.db.flush()

        initial_message = SupportMessage(
            ticket_id=ticket.id,
            user_id=customer_id,
            content=data["description"],
            is_internal=False,
        )
        self.db.add(initial_message)

        AuditService(self.db).log_event(
            user_id=customer_id,
            action="create",
            resource_type="support_tickets",
            resource_id=ticket.id,
            details={"order_id": str(order_id) if order_id else None},
        )

        notifications = NotificationService(self.db)
        notifications.create_many(
            user_ids=notifications.admin_user_ids(),
            title="Nouveau ticket client",
            message=f"Le client a ouvert le ticket : {ticket.title}",
            notification_type="supportTicketCreated",
            metadata={"ticketId": str(ticket.id), "page": "admin", "section": "support"},
        )

        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def list_tickets_for_user(self, user_id: UUID, *, is_admin: bool = False) -> List[SupportTicket]:
        query = (
            self.db.query(SupportTicket)
            .options(
                joinedload(SupportTicket.messages),
                joinedload(SupportTicket.ticket_attachments),
            )
            .order_by(SupportTicket.updated_at.desc())
        )
        if not is_admin:
            query = query.filter(SupportTicket.user_id == user_id)
        return query.limit(200).all()

    def get_ticket(self, ticket_id: UUID, user_id: UUID, *, is_admin: bool = False) -> Optional[SupportTicket]:
        ticket = (
            self.db.query(SupportTicket)
            .options(
                joinedload(SupportTicket.messages),
                joinedload(SupportTicket.ticket_attachments),
            )
            .filter(SupportTicket.id == ticket_id)
            .first()
        )
        if not ticket:
            return None
        if not is_admin and str(ticket.user_id) != str(user_id):
            return None
        return ticket

    def add_message(self, ticket_id: UUID, user_id: UUID, content: str, *, is_admin: bool = False) -> SupportMessage:
        ticket = self.get_ticket(ticket_id, user_id, is_admin=is_admin)
        if not ticket:
            raise ValidationError("Ticket introuvable ou accès refusé")
        if ticket.status == TicketStatus.CLOSED.value:
            raise ValidationError("Ce ticket est fermé")

        message = SupportMessage(
            ticket_id=ticket.id,
            user_id=user_id,
            content=content,
            is_internal=False,
        )
        self.db.add(message)

        if ticket.status == TicketStatus.OPEN.value:
            ticket.status = TicketStatus.IN_PROGRESS.value

        AuditService(self.db).log_event(
            user_id=user_id,
            action="create",
            resource_type="support_messages",
            resource_id=ticket.id,
            details={"ticket_id": str(ticket.id)},
        )

        if is_admin:
            NotificationService(self.db).create(
                user_id=ticket.user_id,
                title="Réponse support",
                message=f"Nouvelle réponse sur votre demande : {ticket.title}",
                notification_type="supportTicketReply",
                metadata={"ticketId": str(ticket.id), "page": "support"},
            )

        self.db.commit()
        self.db.refresh(message)
        return message

    def add_attachment(
        self,
        ticket_id: UUID,
        user_id: UUID,
        *,
        file_url: str,
        file_name: Optional[str] = None,
        mime_type: Optional[str] = None,
        size: Optional[int] = None,
        is_admin: bool = False,
    ) -> SupportTicketAttachment:
        ticket = self.get_ticket(ticket_id, user_id, is_admin=is_admin)
        if not ticket:
            raise ValidationError("Ticket introuvable ou accès refusé")

        attachment = SupportTicketAttachment(
            ticket_id=ticket.id,
            uploaded_by=user_id,
            file_url=file_url,
            file_name=file_name,
            mime_type=mime_type,
            size=size,
        )
        self.db.add(attachment)

        proof_message = SupportMessage(
            ticket_id=ticket.id,
            user_id=user_id,
            content=f"[Preuve jointe] {file_name or file_url}",
            is_internal=False,
            attachments=json.dumps([{
                "file_url": file_url,
                "file_name": file_name,
                "mime_type": mime_type,
                "size": size,
            }]),
        )
        self.db.add(proof_message)

        AuditService(self.db).log_event(
            user_id=user_id,
            action="create",
            resource_type="support_ticket_attachments",
            resource_id=ticket.id,
            details={"file_name": file_name, "mime_type": mime_type},
        )

        notifications = NotificationService(self.db)
        notifications.create_many(
            user_ids=notifications.admin_user_ids(),
            title="Preuve jointe par client",
            message=f"Une preuve a été ajoutée au ticket : {ticket.title}",
            notification_type="supportTicketAttachment",
            metadata={"ticketId": str(ticket.id), "page": "admin", "section": "support"},
        )

        self.db.commit()
        self.db.refresh(attachment)
        return attachment

    def build_ticket_response(self, ticket: SupportTicket) -> dict:
        order_number = None
        payment_status = None
        if ticket.order_id:
            order = self.db.query(Order).filter(Order.id == ticket.order_id).first()
            if order:
                order_number = order.order_number
                payment_status = getattr(order.payment_status, "value", order.payment_status)

        visible_messages = [
            message for message in (ticket.messages or []) if not message.is_internal
        ]

        return {
            "id": ticket.id,
            "user_id": ticket.user_id,
            "title": ticket.title,
            "description": ticket.description,
            "status": ticket.status,
            "priority": ticket.priority,
            "category": ticket.category,
            "order_id": ticket.order_id,
            "partner_id": ticket.partner_id,
            "order_number": order_number,
            "payment_status": payment_status,
            "created_at": ticket.created_at,
            "updated_at": ticket.updated_at,
            "messages": visible_messages,
            "attachments": ticket.ticket_attachments or [],
        }

    @staticmethod
    def ensure_customer_role(user: User) -> None:
        if user.role not in {UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN}:
            raise ValidationError("Seuls les clients peuvent créer des tickets de support")
