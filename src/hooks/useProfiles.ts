import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

export interface ProfileWithRole extends Profile {
  role?: AppRole;
}

// Fetch all profiles (for admin)
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return profiles as Profile[];
    },
  });
}

// Fetch profiles with roles
export function useProfilesWithRoles() {
  return useQuery({
    queryKey: ['profiles', 'with-roles'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Map roles to profiles
      const profilesWithRoles: ProfileWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role,
        };
      });

      return profilesWithRoles;
    },
  });
}

// Fetch profiles by role (SDRs, Closers, etc.)
export function useProfilesByRole(role: AppRole) {
  return useQuery({
    queryKey: ['profiles', 'by-role', role],
    queryFn: async () => {
      // Get user IDs with this role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', role);

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        return [];
      }

      const userIds = roleData.map((r) => r.user_id);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      return (profiles || []).map((p) => ({ ...p, role })) as ProfileWithRole[];
    },
  });
}

// Fetch SDRs
export function useSDRs() {
  return useProfilesByRole('sdr');
}

// Fetch Closers
export function useClosers() {
  return useProfilesByRole('closer');
}

// Fetch Admins
export function useAdmins() {
  return useProfilesByRole('admin');
}
