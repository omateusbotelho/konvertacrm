import { AppRole } from '@/types/auth';
import { DealWithCompany } from '@/hooks/useDeals';

/**
 * Check if a user can edit a specific deal based on their role and the deal's state.
 * 
 * Rules:
 * - Admin can edit any deal
 * - Closer can edit deals they own or are assigned to as closer
 * - SDR can edit deals they created ONLY if no closer_id is assigned yet
 *   (once a closer is assigned, SDR loses edit permissions - read-only)
 */
export function canEditDeal(
  deal: DealWithCompany | null,
  userId: string | undefined,
  role: AppRole | null
): boolean {
  if (!deal || !userId || !role) return false;

  // Admin can edit any deal
  if (role === 'admin') return true;

  // Closer can edit deals where they are the closer or owner
  if (role === 'closer') {
    return deal.closer_id === userId || deal.owner_id === userId;
  }

  // SDR can only edit if:
  // 1. They are the owner (sdr_id or owner_id)
  // 2. AND no closer_id has been assigned yet
  if (role === 'sdr') {
    const isOwner = deal.owner_id === userId || deal.sdr_id === userId;
    const hasCloserAssigned = !!deal.closer_id;
    
    // SDR loses edit permission once a closer is assigned
    return isOwner && !hasCloserAssigned;
  }

  return false;
}

/**
 * Check if a user can only view a deal (read-only access)
 */
export function isReadOnlyForUser(
  deal: DealWithCompany | null,
  userId: string | undefined,
  role: AppRole | null
): boolean {
  if (!deal || !userId || !role) return true;

  // If user can edit, they don't have read-only access
  return !canEditDeal(deal, userId, role);
}

/**
 * Get a message explaining why a user has read-only access
 */
export function getReadOnlyReason(
  deal: DealWithCompany | null,
  userId: string | undefined,
  role: AppRole | null
): string | null {
  if (!deal || !userId || !role) return null;

  if (!isReadOnlyForUser(deal, userId, role)) {
    return null; // User can edit
  }

  if (role === 'sdr' && deal.closer_id) {
    const isOwner = deal.owner_id === userId || deal.sdr_id === userId;
    if (isOwner) {
      return 'Este deal foi atribuído a um Closer. Você possui apenas acesso de leitura.';
    }
  }

  return 'Você não tem permissão para editar este deal.';
}
