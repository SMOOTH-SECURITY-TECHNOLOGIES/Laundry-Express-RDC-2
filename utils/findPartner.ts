import { Partner } from '../types';
import { DB } from '../constants';

/**
 * Find a partner by ID, first from the context array,
 * then fallback to the local mock DB.
 * This prevents blank screens when partners context hasn't loaded yet.
 */
export function findPartner(
  partners: Partner[],
  partnerId: string | undefined
): Partner | null {
  if (!partnerId) return null;
  const ctxPartner = partners.find(p => p.id === partnerId);
  if (ctxPartner) return ctxPartner;
  const dbPartners: Partner[] = DB.get('partners');
  return dbPartners.find(p => p.id === partnerId) || null;
}
