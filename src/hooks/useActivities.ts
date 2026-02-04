import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toastSuccess, toastError } from '@/lib/toast';

type Activity = Database['public']['Tables']['activities']['Row'];
type ActivityInsert = Database['public']['Tables']['activities']['Insert'];
type ActivityType = Database['public']['Enums']['activity_type'];

export interface ActivityWithRelations extends Activity {
  companies?: { name: string } | null;
  deals?: { title: string } | null;
  assigned_profile?: { full_name: string } | null;
  creator_profile?: { full_name: string } | null;
}

export interface CreateActivityData {
  title: string;
  type: ActivityType;
  description?: string | null;
  deal_id?: string | null;
  company_id?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
}

export interface ActivityFilters {
  filter: 'all' | 'mine' | 'pending' | 'overdue';
  dealId?: string;
  companyId?: string;
}

// Fetch activities with filters
export function useActivities(filters: ActivityFilters = { filter: 'all' }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activities', filters, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('activities')
        .select(`
          *,
          companies!activities_company_id_fkey (name),
          deals!activities_deal_id_fkey (title)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.filter === 'mine') {
        query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
      } else if (filters.filter === 'pending') {
        query = query.eq('is_completed', false);
      } else if (filters.filter === 'overdue') {
        query = query
          .eq('is_completed', false)
          .lt('due_date', new Date().toISOString());
      }

      if (filters.dealId) {
        query = query.eq('deal_id', filters.dealId);
      }

      if (filters.companyId) {
        query = query.eq('company_id', filters.companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityWithRelations[];
    },
    enabled: !!user,
  });
}

// Fetch activities for a specific deal
export function useDealActivities(dealId: string | undefined) {
  return useActivities({ filter: 'all', dealId });
}

// Fetch activities for a specific company
export function useCompanyActivities(companyId: string | undefined) {
  return useActivities({ filter: 'all', companyId });
}

// Create activity
export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateActivityData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const activityData: ActivityInsert = {
        ...data,
        created_by: user.id,
        is_completed: false,
      };

      const { data: activity, error } = await supabase
        .from('activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;
      return activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toastSuccess('Atividade criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating activity:', error);
      toastError('Erro ao criar atividade. Tente novamente.');
    },
  });
}

// Update activity
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateActivityData> }) => {
      const { data: activity, error } = await supabase
        .from('activities')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toastSuccess('Atividade atualizada!');
    },
    onError: (error) => {
      console.error('Error updating activity:', error);
      toastError('Erro ao atualizar atividade.');
    },
  });
}

// Complete activity
export function useCompleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: activity, error } = await supabase
        .from('activities')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toastSuccess('Atividade concluída!');
    },
    onError: (error) => {
      console.error('Error completing activity:', error);
      toastError('Erro ao concluir atividade.');
    },
  });
}

// Delete activity
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toastSuccess('Atividade excluída.');
    },
    onError: (error) => {
      console.error('Error deleting activity:', error);
      toastError('Erro ao excluir atividade.');
    },
  });
}
