import { SupportTicket, TicketMessage, TicketStatus } from '../types';
import type { CustomerClaim, CustomerSupportTicket } from '../services/real-api';

function mapTicketStatus(status: string): TicketStatus {
  switch ((status || '').toLowerCase()) {
    case 'in_progress':
      return TicketStatus.IN_PROGRESS;
    case 'closed':
    case 'resolved':
      return TicketStatus.CLOSED;
    default:
      return TicketStatus.OPEN;
  }
}

export function mapCustomerSupportTicketToFrontend(ticket: CustomerSupportTicket, userName = 'Moi'): SupportTicket {
  const messages: TicketMessage[] = (ticket.messages || []).map((message) => ({
    id: message.id,
    authorId: message.user_id,
    authorName: message.user_id === ticket.user_id ? userName : 'Support',
    message: message.content,
    createdAt: message.created_at,
  }));

  return {
    id: ticket.id,
    userId: ticket.user_id,
    userName,
    orderId: ticket.order_id || undefined,
    subject: ticket.title,
    messages,
    status: mapTicketStatus(ticket.status),
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    category: ticket.category as SupportTicket['category'],
  };
}

export function mapCustomerClaimLabel(claim: CustomerClaim): string {
  return `${claim.claim_number} — ${claim.title}`;
}

export function formatSupportStatus(status: string): string {
  switch ((status || '').toLowerCase()) {
    case 'open':
    case 'new':
      return 'Ouvert';
    case 'in_progress':
    case 'investigating':
      return 'En cours';
    case 'waiting_customer':
      return 'En attente de vous';
    case 'resolved':
      return 'Résolu';
    case 'closed':
    case 'rejected':
      return 'Fermé';
    default:
      return status;
  }
}
