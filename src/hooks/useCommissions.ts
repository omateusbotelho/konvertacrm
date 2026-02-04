import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toastSuccess, toastError } from '@/lib/toast';

type Commission = Database['public']['Tables']['commissions']['Row'];
type CommissionStatus = Database['public']['Enums']['commission_status'];
type CommissionType = Database['public']['Enums']['commission_type'];

export interface CommissionWithRelations extends Commission {
  deals?: { title: string; companies?: { name: string } | null } | null;
  profiles?: { full_name: string } | null;
}

export interface CommissionFilters {
  status?: CommissionStatus | 'all';
  userId?: string;
  type?: CommissionType | 'all';
}

export interface CommissionMetrics {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  countPending: number;
  countApproved: number;
}

// Fetch commissions with filters
export function useCommissions(filters: CommissionFilters = {}) {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['commissions', filters, user?.id, role],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('commissions')
        .select(`
          *,
          deals!commissions_deal_id_fkey (
            title,
            companies!deals_company_id_fkey (name)
          )
        `)
        .order('created_at', { ascending: false });

      // Non-admin users can only see their own commissions
      if (role !== 'admin') {
        query = query.eq('user_id', user.id);
      } else if (filters.userId && filters.userId !== 'all') {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.type && filters.type !== 'all') {
        query = query.eq('commission_type', filters.type);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set((data || []).map(c => c.user_id).filter(Boolean))];
      let profiles: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        profiles = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {} as Record<string, string>);
      }

      return (data || []).map(c => ({
        ...c,
        profiles: c.user_id ? { full_name: profiles[c.user_id] || 'Desconhecido' } : null,
      })) as CommissionWithRelations[];
    },
    enabled: !!user,
  });
}

// Fetch commission metrics
export function useCommissionMetrics() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['commissions', 'metrics', user?.id, role],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase.from('commissions').select('amount, status');
      
      if (role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const metrics: CommissionMetrics = {
        totalPending: 0,
        totalApproved: 0,
        totalPaid: 0,
        countPending: 0,
        countApproved: 0,
      };

      (data || []).forEach(c => {
        if (c.status === 'pending') {
          metrics.totalPending += c.amount;
          metrics.countPending += 1;
        } else if (c.status === 'approved') {
          metrics.totalApproved += c.amount;
          metrics.countApproved += 1;
        } else if (c.status === 'paid') {
          metrics.totalPaid += c.amount;
        }
      });

      return metrics;
    },
    enabled: !!user,
  });
}

// Approve commission (Admin only)
export function useApproveCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('commissions')
        .update({ status: 'approved' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toastSuccess('Comissão aprovada!');
    },
    onError: (error) => {
      console.error('Error approving commission:', error);
      toastError('Erro ao aprovar comissão.');
    },
  });
}

// Mark commission as paid (Admin only)
export function usePayCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('commissions')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toastSuccess('Comissão marcada como paga!');
    },
    onError: (error) => {
      console.error('Error paying commission:', error);
      toastError('Erro ao marcar comissão como paga.');
    },
  });
}

// Cancel commission (Admin only)
export function useCancelCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('commissions')
        .update({
          status: 'cancelled',
          notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toastSuccess('Comissão cancelada.');
    },
    onError: (error) => {
      console.error('Error cancelling commission:', error);
      toastError('Erro ao cancelar comissão.');
    },
  });
}
