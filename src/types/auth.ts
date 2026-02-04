import { User, Session } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'closer' | 'sdr';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface AuthUser {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
}

// Permission definitions per role - Detailed matrix
export const ROLE_PERMISSIONS = {
  admin: {
    // === DEALS ===
    canViewAllDeals: true,
    canCreateDeal: true,
    canEditAnyDeal: true,
    canEditOwnDeals: true,
    canDeleteDeals: true,
    canCloseDealWon: true,
    canMarkDealLost: true,
    canMoveDealsToAnyStage: true,
    
    // === COMPANIES & CONTACTS ===
    canViewAllCompanies: true,
    canCreateCompany: true,
    canEditCompany: true,
    canDeleteCompany: true,
    canViewAllContacts: true,
    canCreateContact: true,
    canEditContact: true,
    canDeleteContact: true,
    
    // === COMMISSIONS ===
    canViewAllCommissions: true,
    canViewOwnCommissions: true,
    canApproveCommissions: true,
    canConfigureRules: true,
    
    // === USERS ===
    canViewUserList: true,
    canManageUsers: true,
    
    // === REPORTS & DASHBOARDS ===
    canViewExecutiveDashboard: true,
    canViewSellerDashboard: true,
    canViewSDRDashboard: true,
    canViewAllReports: true,
    canExportData: true,
  },
  closer: {
    // === DEALS ===
    canViewAllDeals: true,
    canCreateDeal: true,
    canEditAnyDeal: false,
    canEditOwnDeals: true,
    canDeleteDeals: false,
    canCloseDealWon: true,
    canMarkDealLost: true,
    canMoveDealsToAnyStage: true,
    
    // === COMPANIES & CONTACTS ===
    canViewAllCompanies: true,
    canCreateCompany: true,
    canEditCompany: true,
    canDeleteCompany: false,
    canViewAllContacts: true,
    canCreateContact: true,
    canEditContact: true,
    canDeleteContact: false,
    
    // === COMMISSIONS ===
    canViewAllCommissions: false,
    canViewOwnCommissions: true,
    canApproveCommissions: false,
    canConfigureRules: false,
    
    // === USERS ===
    canViewUserList: true,
    canManageUsers: false,
    
    // === REPORTS & DASHBOARDS ===
    canViewExecutiveDashboard: false,
    canViewSellerDashboard: true,
    canViewSDRDashboard: false,
    canViewAllReports: false,
    canExportData: false,
  },
  sdr: {
    // === DEALS ===
    canViewAllDeals: false, // Only own deals
    canCreateDeal: true,
    canEditAnyDeal: false,
    canEditOwnDeals: true,
    canDeleteDeals: false,
    canCloseDealWon: false, // Cannot close deals
    canMarkDealLost: true, // Can mark own deals as lost
    canMoveDealsToAnyStage: false, // Only up to 'qualified'
    
    // === COMPANIES & CONTACTS ===
    canViewAllCompanies: true,
    canCreateCompany: true,
    canEditCompany: true,
    canDeleteCompany: false,
    canViewAllContacts: true,
    canCreateContact: true,
    canEditContact: true,
    canDeleteContact: false,
    
    // === COMMISSIONS ===
    canViewAllCommissions: false,
    canViewOwnCommissions: true, // Only qualification commissions
    canApproveCommissions: false,
    canConfigureRules: false,
    
    // === USERS ===
    canViewUserList: true,
    canManageUsers: false,
    
    // === REPORTS & DASHBOARDS ===
    canViewExecutiveDashboard: false,
    canViewSellerDashboard: false,
    canViewSDRDashboard: true,
    canViewAllReports: false,
    canExportData: false,
  },
} as const;

// Stage restrictions for SDR role
export const SDR_ALLOWED_STAGES = ['lead', 'qualified'] as const;

// Stages that only closers/admins can move to
export const CLOSER_ONLY_STAGES = ['proposal', 'negotiation', 'closed_won', 'closed_lost'] as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.admin;

export function hasPermission(role: AppRole | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][permission];
}

export function canMoveToStage(role: AppRole | null, stage: string): boolean {
  if (!role) return false;
  if (role === 'admin' || role === 'closer') return true;
  
  // SDR can only move to lead or qualified
  const sdrAllowedStages = ['lead', 'qualified'];
  return sdrAllowedStages.includes(stage);
}
