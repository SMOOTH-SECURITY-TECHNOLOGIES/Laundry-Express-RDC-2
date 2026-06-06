from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PartnerInvoiceEligibleOrder(BaseModel):
    order_id: UUID
    order_number: str
    completed_at: Optional[str] = None
    customer_name: Optional[str] = None
    amount: Decimal
    currency: str
    proforma_generated_at: Optional[str] = None
    invoice_generated_at: Optional[str] = None
    can_generate_proforma: bool
    can_generate_invoice: bool


class PartnerInvoiceEligibleOrdersResponse(BaseModel):
    items: list[PartnerInvoiceEligibleOrder] = Field(default_factory=list)


class PartnerInvoiceDocumentLineItem(BaseModel):
    description: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal


class PartnerInvoiceDocumentPayload(BaseModel):
    order_id: UUID
    order_number: str
    currency: str
    partner_name: str
    partner_address: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: str
    completed_at: Optional[str] = None
    generated_at: str
    document_reference: str
    line_items: list[PartnerInvoiceDocumentLineItem] = Field(default_factory=list)
    subtotal_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal


class PartnerGeneratedDocument(BaseModel):
    document_type: Literal["proforma", "invoice"]
    generated_at: str
    payload: PartnerInvoiceDocumentPayload


class PartnerOrderDocumentsResponse(BaseModel):
    proforma: Optional[PartnerGeneratedDocument] = None
    invoice: Optional[PartnerGeneratedDocument] = None
