from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderStatus
from app.models.partner import PartnerLocation
from app.repositories.order_repository import OrderRepository
from app.schemas.partner_invoicing import (
    PartnerGeneratedDocument,
    PartnerInvoiceDocumentLineItem,
    PartnerInvoiceDocumentPayload,
    PartnerInvoiceEligibleOrder,
    PartnerInvoiceEligibleOrdersResponse,
    PartnerOrderDocumentsResponse,
)


class PartnerInvoicingService:
    """Services backend canoniques de facturation partenaire."""

    def __init__(self, db: Session):
        self.db = db
        self.repository = OrderRepository(db)

    def list_invoice_eligible_orders(self, partner_id: UUID) -> PartnerInvoiceEligibleOrdersResponse:
        orders = (
            self.db.query(Order)
            .options(joinedload(Order.customer))
            .filter(
                Order.partner_id == partner_id,
                Order.status == OrderStatus.COMPLETED.value,
            )
            .order_by(Order.completed_at.desc().nullslast(), Order.created_at.desc(), Order.id.desc())
            .all()
        )

        return PartnerInvoiceEligibleOrdersResponse(
            items=[self._serialize_eligible_order(order) for order in orders]
        )

    def generate_document(self, order_id: UUID, document_type: str) -> PartnerGeneratedDocument:
        order = self._get_order_or_raise(order_id)
        self._ensure_invoice_eligible(order)

        generated_at = datetime.now(timezone.utc).isoformat()
        document_reference = f"{document_type.upper()}-{order.order_number}"

        breakdown = dict(order.calculation_breakdown or {})
        generated_documents = dict(breakdown.get("generated_documents") or {})
        generated_documents[document_type] = {
            "generated_at": generated_at,
            "document_reference": document_reference,
        }
        breakdown["generated_documents"] = generated_documents
        order.calculation_breakdown = breakdown
        self.repository.update(order)
        self.db.commit()
        self.db.refresh(order)

        return self._build_document(order, document_type)

    def get_order_documents(self, order_id: UUID) -> PartnerOrderDocumentsResponse:
        order = self._get_order_or_raise(order_id)
        breakdown = dict(order.calculation_breakdown or {})
        generated_documents = dict(breakdown.get("generated_documents") or {})

        return PartnerOrderDocumentsResponse(
            proforma=self._build_document(order, "proforma") if "proforma" in generated_documents else None,
            invoice=self._build_document(order, "invoice") if "invoice" in generated_documents else None,
        )

    def _get_order_or_raise(self, order_id: UUID) -> Order:
        order = (
            self.db.query(Order)
            .options(
                joinedload(Order.customer),
                joinedload(Order.partner),
                joinedload(Order.pickup_address),
                joinedload(Order.delivery_address),
                joinedload(Order.items),
            )
            .filter(Order.id == order_id)
            .first()
        )
        if not order:
            raise ValueError("Commande introuvable")
        return order

    @staticmethod
    def _ensure_invoice_eligible(order: Order) -> None:
        if str(order.status) != OrderStatus.COMPLETED.value:
            raise ValueError("Seules les commandes terminées sont facturables")

    def _build_document(self, order: Order, document_type: str) -> PartnerGeneratedDocument:
        breakdown = dict(order.calculation_breakdown or {})
        generated_documents = dict(breakdown.get("generated_documents") or {})
        metadata = dict(generated_documents.get(document_type) or {})

        generated_at = metadata.get("generated_at") or datetime.now(timezone.utc).isoformat()
        document_reference = metadata.get("document_reference") or f"{document_type.upper()}-{order.order_number}"

        return PartnerGeneratedDocument(
            document_type=document_type,  # type: ignore[arg-type]
            generated_at=generated_at,
            payload=PartnerInvoiceDocumentPayload(
                order_id=order.id,
                order_number=order.order_number,
                currency=order.currency,
                partner_name=getattr(order.partner, "name", "") or "",
                partner_address=self._format_partner_address(order.partner_id),
                customer_name=order.customer_name or "Client",
                customer_phone=order.customer_phone,
                customer_address=self._format_customer_address(order),
                completed_at=order.completed_at.isoformat() if order.completed_at else None,
                generated_at=generated_at,
                document_reference=document_reference,
                line_items=[
                    PartnerInvoiceDocumentLineItem(
                        description=(item.item_name or "").strip() or order.order_number,
                        quantity=item.quantity or Decimal("0.00"),
                        unit_price=item.unit_price or Decimal("0.00"),
                        line_total=item.line_total or Decimal("0.00"),
                    )
                    for item in (order.items or [])
                ],
                subtotal_amount=order.subtotal_amount or Decimal("0.00"),
                discount_amount=order.discount_amount or Decimal("0.00"),
                total_amount=order.total_amount or Decimal("0.00"),
            ),
        )

    @staticmethod
    def _serialize_eligible_order(order: Order) -> PartnerInvoiceEligibleOrder:
        breakdown = dict(order.calculation_breakdown or {})
        generated_documents = dict(breakdown.get("generated_documents") or {})
        proforma = dict(generated_documents.get("proforma") or {})
        invoice = dict(generated_documents.get("invoice") or {})

        return PartnerInvoiceEligibleOrder(
            order_id=order.id,
            order_number=order.order_number,
            completed_at=order.completed_at.isoformat() if order.completed_at else None,
            customer_name=order.customer_name,
            amount=order.total_amount or Decimal("0.00"),
            currency=order.currency,
            proforma_generated_at=proforma.get("generated_at"),
            invoice_generated_at=invoice.get("generated_at"),
            can_generate_proforma=True,
            can_generate_invoice=True,
        )

    def _format_partner_address(self, partner_id: UUID) -> str:
        location = (
            self.db.query(PartnerLocation)
            .filter(
                PartnerLocation.partner_id == partner_id,
                PartnerLocation.is_primary.is_(True),
            )
            .first()
        ) or (
            self.db.query(PartnerLocation)
            .filter(PartnerLocation.partner_id == partner_id)
            .first()
        )

        if not location:
            return ""

        parts = [
            location.address_line_1,
            location.address_line_2,
            location.commune,
            location.city,
        ]
        return ", ".join(part for part in parts if part)

    @staticmethod
    def _format_customer_address(order: Order) -> str:
        address = order.pickup_address or order.delivery_address
        if not address:
            return ""
        parts = [
            getattr(address, "address_line_1", None),
            getattr(address, "address_line_2", None),
            getattr(address, "commune", None),
            getattr(address, "city", None),
        ]
        return ", ".join(part for part in parts if part)
