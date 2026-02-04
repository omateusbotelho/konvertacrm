import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toastSuccess, toastError } from '@/lib/toast';
import { getStageProbability, DealStage, calculateRetainerValue } from '@/lib/deal-calculations';

type Deal = Database['public']['Tables']['deals']['Row'];
type DealInsert = Database['public']['Tables']['deals']['Insert'];
type DealUpdate = Database['public']['Tables']['deals']['Update'];
type DealSource = Database['public']['Enums']['deal_source'];
type DealType = Database['public']['Enums']['deal_type'];

export interface DealWithCompany extends Deal {
  companies: {
    id: string;
    name: string;
  } | null;
  owner_profile?: {
    full_name: string;
  } | null;
  sdr_profile?: {
    full_name: string;
  } | null;
  closer_profile?: {
    full_name: string;
  } | null;
}

export interface CreateDealData {
  title: string;
  company_id: string | null;
  deal_type: DealType;
  value: number;
  monthly_value?: number | null;
  contract_duration_months?: number | null;
  source: DealSource;
  expected_close_date?: string | null;
  sdr_id?: string | null;
  closer_id?: string | null;
  monthly_hours?: number | null;
  hours_rollover?: boolean;
}

export interface UpdateDealData extends Partial<CreateDealData> {
  stage?: DealStage;
  probability?: number;
  actual_close_date?: string | null;
  loss_reason?: Database['public']['Enums']['loss_reason'] | null;
  loss_notes?: string | null;
  loss_competitor?: string | null;
}

// Filter options for deals
export interface DealFilters {
  ownership?: 'all' | 'mine';
  dealType?: 'all' | 'retainer' | 'project';
  searchQuery?: string;
}

// Fetch all deals with filters
export function useDeals(filters?: DealFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deals', filters],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select(`
          *,
          companies!deals_company_id_fkey (id, name)
        `)
        .order('created_at', { ascending: false });

      // Apply ownership filter
      if (filters?.ownership === 'mine' && user) {
        query = query.or(`owner_id.eq.${user.id},closer_id.eq.${user.id},sdr_id.eq.${user.id}`);
      }

      // Apply deal type filter
      if (filters?.dealType && filters.dealType !== 'all') {
        query = query.eq('deal_type', filters.dealType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply search filter client-side (for company name which is a join)
      let filteredData = data as DealWithCompany[];
      
      if (filters?.searchQuery && filters.searchQuery.trim()) {
        const search = filters.searchQuery.toLowerCase().trim();
        filteredData = filteredData.filter(
          (deal) =>
            deal.title.toLowerCase().includes(search) ||
            deal.companies?.name?.toLowerCase().includes(search)
        );
      }

      return filteredData;
    },
    enabled: !!user,
  });
}

// Fetch deals grouped by stage (for Kanban)
export function useDealsByStage(filters?: DealFilters) {
  const { data: deals, isLoading, error, refetch } = useDeals(filters);

  const stages: Record<DealStage, DealWithCompany[]> = {
    lead: [],
    qualified: [],
    proposal: [],
    negotiation: [],
    closed_won: [],
    closed_lost: [],
  };

  if (deals) {
    deals.forEach((deal) => {
      const stage = deal.stage as DealStage;
      if (stages[stage]) {
        stages[stage].push(deal);
      }
    });
  }

  return { stages, isLoading, error, refetch };
}

// Helper to get default SDR ID based on role
const getDefaultSDRId = (
  providedSDRId: string | null | undefined, 
  userId: string, 
  userRole: string | null
): string | null => {
  // If an SDR was explicitly provided, use it
  if (providedSDRId) {
    return providedSDRId;
  }
  
  // If current user is SDR, assign to them
  if (userRole === 'sdr') {
    return userId;
  }
  
  // Otherwise, leave null (to be assigned later)
  return null;
};

// Create a new deal
export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateDealData) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Calculate total value for retainer
      let totalValue = data.value;
      if (data.deal_type === 'retainer' && data.monthly_value && data.contract_duration_months) {
        totalValue = calculateRetainerValue(data.monthly_value, data.contract_duration_months);
      }

      const dealData: DealInsert = {
        title: data.title,
        company_id: data.company_id,
        deal_type: data.deal_type,
        value: totalValue,
        monthly_value: data.monthly_value,
        contract_duration_months: data.contract_duration_months,
        source: data.source,
        expected_close_date: data.expected_close_date,
        owner_id: user.id,
        sdr_id: getDefaultSDRId(data.sdr_id, user.id, role),
        closer_id: data.closer_id,
        monthly_hours: data.monthly_hours,
        hours_rollover: data.hours_rollover || false,
        stage: 'lead',
        probability: getStageProbability('lead'),
      };

      const { data: deal, error } = await supabase
        .from('deals')
        .insert(dealData)
        .select()
        .single();

      if (error) throw error;

      // Create automatic activity for deal creation
      await supabase.from('activities').insert({
        title: 'Deal criado',
        type: 'note',
        deal_id: deal.id,
        company_id: data.company_id,
        created_by: user.id,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      return deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toastSuccess('Deal criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating deal:', error);
      toastError('Erro ao criar deal. Tente novamente.');
    },
  });
}

// Update a deal
export function useUpdateDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data, 
      previousCloserId 
    }: { 
      id: string; 
      data: UpdateDealData;
      previousCloserId?: string | null;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Recalculate total value if retainer values changed
      let updateData: DealUpdate = { ...data };
      
      if (data.monthly_value !== undefined && data.contract_duration_months !== undefined) {
        if (data.monthly_value && data.contract_duration_months) {
          updateData.value = calculateRetainerValue(data.monthly_value, data.contract_duration_months);
        }
      }

      const { data: deal, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          companies!deals_company_id_fkey (id, name)
        `)
        .single();

      if (error) throw error;

      // Create activity if Closer was assigned/changed
      if (data.closer_id && data.closer_id !== previousCloserId) {
        // Get closer name
        const { data: closerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.closer_id)
          .single();

        const closerName = closerProfile?.full_name || 'Closer';

        await supabase.from('activities').insert({
          title: `Deal atribuído para ${closerName}`,
          type: 'note',
          deal_id: id,
          company_id: deal.company_id,
          created_by: user.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      return deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toastSuccess('Deal atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating deal:', error);
      toastError('Erro ao atualizar deal. Tente novamente.');
    },
  });
}

// Move deal to a new stage (with commission/activity creation)
export function useMoveDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      dealId,
      fromStage,
      toStage,
      dealData,
      additionalData,
    }: {
      dealId: string;
      fromStage: DealStage;
      toStage: DealStage;
      dealData: DealWithCompany;
      additionalData?: {
        lossReason?: string;
        lossNotes?: string;
        lossCompetitor?: string;
        actualCloseDate?: string;
        startRecurring?: boolean;
      };
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // For closed_won, use edge function to handle commissions
      if (toStage === 'closed_won') {
        const { data, error } = await supabase.functions.invoke('process-deal-commissions', {
          body: {
            deal_id: dealId,
            actual_close_date: additionalData?.actualCloseDate || new Date().toISOString().split('T')[0],
            start_recurring: additionalData?.startRecurring || false,
          },
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Erro ao processar comissões');
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        // Create activity for stage change
        await supabase.from('activities').insert({
          title: `Deal fechado como ganho`,
          type: 'note',
          deal_id: dealId,
          company_id: dealData.company_id,
          created_by: user.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });

        return data;
      }

      // For other stage movements, use direct update
      const newProbability = getStageProbability(toStage);

      const updateData: DealUpdate = {
        stage: toStage,
        probability: newProbability,
      };

      // Handle closed_lost
      if (toStage === 'closed_lost' && additionalData) {
        updateData.loss_reason = additionalData.lossReason as Database['public']['Enums']['loss_reason'];
        updateData.loss_notes = additionalData.lossNotes;
        updateData.loss_competitor = additionalData.lossCompetitor;
      }

      // Update the deal
      const { data: updatedDeal, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', dealId)
        .select()
        .single();

      if (error) throw error;

      // Create activity for stage change
      await supabase.from('activities').insert({
        title: `Deal movido de ${fromStage} para ${toStage}`,
        type: 'note',
        deal_id: dealId,
        company_id: dealData.company_id,
        created_by: user.id,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      // Create commission on qualification (SDR)
      if (fromStage === 'lead' && toStage === 'qualified' && dealData.sdr_id) {
        // Get qualification commission rule
        const { data: rules } = await supabase
          .from('commission_rules')
          .select('*')
          .eq('commission_type', 'qualification')
          .eq('is_active', true);

        const rule = rules?.[0];
        if (rule && rule.percentage) {
          const commissionAmount = dealData.value * (rule.percentage / 100);
          await supabase.from('commissions').insert({
            deal_id: dealId,
            user_id: dealData.sdr_id,
            commission_type: 'qualification',
            base_value: dealData.value,
            percentage: rule.percentage,
            amount: commissionAmount,
            status: 'pending',
            notes: `Comissão de qualificação - ${dealData.title}`,
          });
        }
      }

      return updatedDeal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      if (variables.toStage === 'closed_won') {
        toastSuccess('🎉 Deal fechado com sucesso! Comissões criadas.');
      } else if (variables.toStage === 'closed_lost') {
        toastSuccess('Deal marcado como perdido.');
      } else if (variables.toStage === 'qualified') {
        toastSuccess('Deal qualificado! Comissão de qualificação criada.');
      }
    },
    onError: (error) => {
      console.error('Error moving deal:', error);
      toastError('Erro ao mover deal. Tente novamente.');
    },
  });
}

// Delete a deal
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toastSuccess('Deal excluído com sucesso.');
    },
    onError: (error) => {
      console.error('Error deleting deal:', error);
      toastError('Erro ao excluir deal. Tente novamente.');
    },
  });
}
