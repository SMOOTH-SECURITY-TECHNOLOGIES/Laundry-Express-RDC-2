from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.exceptions import ValidationError
from app.models.user import User
from app.schemas.customer_support import (
    CustomerSupportTicketResponse,
    SupportAttachmentCreateRequest,
    SupportAttachmentResponse,
    SupportMessageCreateRequest,
    SupportTicketCreateRequest,
)
from app.services.customer_support_service import CustomerSupportService

router = APIRouter(prefix="/support", tags=["support"])


def _handle_validation_error(exc: ValidationError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/tickets", response_model=CustomerSupportTicketResponse, status_code=status.HTTP_201_CREATED)
def create_support_ticket(
    payload: SupportTicketCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = CustomerSupportService(db)
    try:
        CustomerSupportService.ensure_customer_role(current_user)
        ticket = service.create_ticket(current_user.id, payload.model_dump())
        return service.build_ticket_response(ticket)
    except ValidationError as exc:
        raise _handle_validation_error(exc) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/tickets", response_model=list[CustomerSupportTicketResponse])
def list_support_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = CustomerSupportService(db)
    tickets = service.list_tickets_for_user(current_user.id, is_admin=is_admin_user(current_user))
    return [service.build_ticket_response(ticket) for ticket in tickets]


@router.get("/tickets/{ticket_id}", response_model=CustomerSupportTicketResponse)
def get_support_ticket(
    ticket_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = CustomerSupportService(db)
    ticket = service.get_ticket(ticket_id, current_user.id, is_admin=is_admin_user(current_user))
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")
    return service.build_ticket_response(ticket)


@router.post("/tickets/{ticket_id}/messages", response_model=CustomerSupportTicketResponse)
def add_support_ticket_message(
    ticket_id: UUID,
    payload: SupportMessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = CustomerSupportService(db)
    try:
        service.add_message(
            ticket_id,
            current_user.id,
            payload.content,
            is_admin=is_admin_user(current_user),
        )
        ticket = service.get_ticket(ticket_id, current_user.id, is_admin=is_admin_user(current_user))
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")
        return service.build_ticket_response(ticket)
    except ValidationError as exc:
        raise _handle_validation_error(exc) from exc


@router.post("/tickets/{ticket_id}/attachments", response_model=SupportAttachmentResponse, status_code=status.HTTP_201_CREATED)
def add_support_ticket_attachment(
    ticket_id: UUID,
    payload: SupportAttachmentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = CustomerSupportService(db)
    try:
        attachment = service.add_attachment(
            ticket_id,
            current_user.id,
            file_url=payload.file_url,
            file_name=payload.file_name,
            mime_type=payload.mime_type,
            size=payload.size,
            is_admin=is_admin_user(current_user),
        )
        return attachment
    except ValidationError as exc:
        raise _handle_validation_error(exc) from exc
