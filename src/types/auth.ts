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

// Permission definitions per role
export const ROLE_PERMISSIONS = {
  admin: {
    // Full access
    canViewAllDeals: true,
    canViewAllCommissions: true,
    canApproveCommissions: true,
    canConfigureRules: true,
    canManageUsers: true,
    canDeleteDeals: true,
    canExportData: true,
    canViewAllReports: true,
    canMoveDealsToAnyStage: true,
  },
  closer: {
    // Closer permissions
    canViewAllDeals: true,
    canViewAllCommissions: false, // Only own
    canApproveCommissions: false,
    canConfigureRules: false,
    canManageUsers: false,
    canDeleteDeals: false, // Cannot delete closed deals
    canExportData: false,
    canViewAllReports: false,
    canMoveDealsToAnyStage: true,
  },
  sdr: {
    // SDR permissions - most restricted
    canViewAllDeals: false, // Only own
    canViewAllCommissions: false, // Only own qualification
    canApproveCommissions: false,
    canConfigureRules: false,
    canManageUsers: false,
    canDeleteDeals: false,
    canExportData: false,
    canViewAllReports: false,
    canMoveDealsToAnyStage: false, // Only up to 'qualified'
  },
} as const;

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
