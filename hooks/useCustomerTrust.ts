import { useCallback, useEffect, useState } from 'react';
import { realApi, CustomerClaim, CustomerSupportTicket } from '../services/real-api';
import { features } from '../config/features';

export function useCustomerTrust(enabled = true) {
  const [tickets, setTickets] = useState<CustomerSupportTicket[]>([]);
  const [claims, setClaims] = useState<CustomerClaim[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<CustomerSupportTicket | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<CustomerClaim | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || features.useMockApi) {
      setTickets([]);
      setClaims([]);
      return;
    }

    setIsLoading(true);
    try {
      const [ticketRows, claimRows] = await Promise.all([
        realApi.getCustomerSupportTickets(),
        realApi.getCustomerClaims(),
      ]);
      setTickets(ticketRows);
      setClaims(claimRows);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger vos demandes';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openTicket = useCallback(async (ticketId: string) => {
    const ticket = await realApi.getCustomerSupportTicket(ticketId);
    setSelectedTicket(ticket);
    return ticket;
  }, []);

  const openClaim = useCallback(async (claimId: string) => {
    const claim = await realApi.getCustomerClaim(claimId);
    setSelectedClaim(claim);
    return claim;
  }, []);

  const createTicket = useCallback(async (data: {
    title: string;
    description: string;
    category?: string;
    order_id?: string;
  }) => {
    const created = await realApi.createCustomerSupportTicket(data);
    await refresh();
    return created;
  }, [refresh]);

  const createClaim = useCallback(async (data: {
    title: string;
    description: string;
    type?: string;
    order_id?: string;
  }) => {
    const created = await realApi.createCustomerClaim(data);
    await refresh();
    return created;
  }, [refresh]);

  const replyTicket = useCallback(async (ticketId: string, content: string) => {
    const updated = await realApi.replyCustomerSupportTicket(ticketId, content);
    setSelectedTicket(updated);
    await refresh();
    return updated;
  }, [refresh]);

  const attachProof = useCallback(async (
    ticketId: string,
    file: File,
  ) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
      reader.readAsDataURL(file);
    });

    const attachment = await realApi.attachCustomerSupportProof(ticketId, {
      file_url: dataUrl,
      file_name: file.name,
      mime_type: file.type || undefined,
      size: file.size,
    });
    const ticket = await realApi.getCustomerSupportTicket(ticketId);
    setSelectedTicket(ticket);
    await refresh();
    return attachment;
  }, [refresh]);

  return {
    tickets,
    claims,
    selectedTicket,
    selectedClaim,
    isLoading,
    error,
    refresh,
    openTicket,
    openClaim,
    createTicket,
    createClaim,
    replyTicket,
    attachProof,
    setSelectedTicket,
    setSelectedClaim,
  };
}
