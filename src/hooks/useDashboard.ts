import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DealStage } from '@/lib/deal-calculations';

// Dashboard metrics
export interface DashboardMetrics {
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  pipelineValue: number;
  pipelineValueChange: number;
  newLeads: number;
  newLeadsChange: number;
  conversionRate: number;
  conversionRateChange: number;
  pendingCommissions: number;
}

// Pipeline stage data
export interface PipelineStageData {
  stage: DealStage;
  name: string;
  count: number;
  value: number;
}

// Recent deal data
export interface RecentDealData {
  id: string;
  title: string;
  company: string;
  value: number;
  deal_type: 'retainer' | 'project';
  stage: DealStage;
  daysInStage: number;
}

// Team member performance
export interface TeamMemberPerformance {
  id: string;
  name: string;
  initials: string;
  role: string;
  target: number;
  achieved: number;
  deals: number;
  isLeads?: boolean;
}

// Revenue chart data
export interface RevenueChartData {
  month: string;
  receita: number;
  projecao: number;
}

// Fetch dashboard metrics based on role
export function useDashboardMetrics() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'metrics', user?.id, role],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Base query - filter by role
      let dealsQuery = supabase.from('deals').select('*');
      
      if (role === 'sdr') {
        dealsQuery = dealsQuery.or(`owner_id.eq.${user.id},sdr_id.eq.${user.id}`);
      }

      const { data: allDeals, error: dealsError } = await dealsQuery;
      if (dealsError) throw dealsError;

      // This month's closed deals (revenue)
      const closedWonThisMonth = (allDeals || []).filter(d => 
        d.stage === 'closed_won' && 
        d.actual_close_date && 
        new Date(d.actual_close_date) >= startOfMonth
      );
      const monthlyRevenue = closedWonThisMonth.reduce((sum, d) => sum + d.value, 0);

      // Last month's closed deals
      const closedWonLastMonth = (allDeals || []).filter(d => 
        d.stage === 'closed_won' && 
        d.actual_close_date && 
        new Date(d.actual_close_date) >= startOfLastMonth &&
        new Date(d.actual_close_date) <= endOfLastMonth
      );
      const lastMonthRevenue = closedWonLastMonth.reduce((sum, d) => sum + d.value, 0);
      const monthlyRevenueChange = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Pipeline value (active deals)
      const activeStages: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation'];
      const activeDeals = (allDeals || []).filter(d => activeStages.includes(d.stage as DealStage));
      const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

      // New leads this month
      const newLeadsThisMonth = (allDeals || []).filter(d => 
        new Date(d.created_at!) >= startOfMonth
      ).length;

      const newLeadsLastMonth = (allDeals || []).filter(d => 
        new Date(d.created_at!) >= startOfLastMonth &&
        new Date(d.created_at!) <= endOfLastMonth
      ).length;
      const newLeadsChange = newLeadsLastMonth > 0 
        ? ((newLeadsThisMonth - newLeadsLastMonth) / newLeadsLastMonth) * 100 
        : 0;

      // Conversion rate (closed_won / total closed)
      const closedDeals = (allDeals || []).filter(d => 
        d.stage === 'closed_won' || d.stage === 'closed_lost'
      );
      const wonDeals = closedDeals.filter(d => d.stage === 'closed_won');
      const conversionRate = closedDeals.length > 0 
        ? (wonDeals.length / closedDeals.length) * 100 
        : 0;

      // Pending commissions
      let commissionsQuery = supabase
        .from('commissions')
        .select('amount')
        .eq('status', 'pending');
      
      if (role !== 'admin') {
        commissionsQuery = commissionsQuery.eq('user_id', user.id);
      }

      const { data: pendingComm } = await commissionsQuery;
      const pendingCommissions = (pendingComm || []).reduce((sum, c) => sum + c.amount, 0);

      return {
        monthlyRevenue,
        monthlyRevenueChange,
        pipelineValue,
        pipelineValueChange: 0, // Would need historical data
        newLeads: newLeadsThisMonth,
        newLeadsChange,
        conversionRate,
        conversionRateChange: 0, // Would need historical data
        pendingCommissions,
      } as DashboardMetrics;
    },
    enabled: !!user,
  });
}

// Fetch pipeline overview data
export function usePipelineOverview() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'pipeline-overview', user?.id, role],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase.from('deals').select('stage, value');
      
      if (role === 'sdr') {
        query = query.or(`owner_id.eq.${user.id},sdr_id.eq.${user.id}`);
      }

      // Only active stages
      query = query.in('stage', ['lead', 'qualified', 'proposal', 'negotiation']);

      const { data, error } = await query;
      if (error) throw error;

      const stageNames: Record<string, string> = {
        lead: 'Leads',
        qualified: 'Qualificados',
        proposal: 'Proposta',
        negotiation: 'Negociação',
      };

      const stagesMap: Record<string, { count: number; value: number }> = {
        lead: { count: 0, value: 0 },
        qualified: { count: 0, value: 0 },
        proposal: { count: 0, value: 0 },
        negotiation: { count: 0, value: 0 },
      };

      (data || []).forEach((deal) => {
        if (stagesMap[deal.stage]) {
          stagesMap[deal.stage].count += 1;
          stagesMap[deal.stage].value += deal.value;
        }
      });

      return Object.entries(stagesMap).map(([stage, data]) => ({
        stage: stage as DealStage,
        name: stageNames[stage] || stage,
        count: data.count,
        value: data.value,
      })) as PipelineStageData[];
    },
    enabled: !!user,
  });
}

// Fetch recent deals
export function useRecentDeals(limit = 5) {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'recent-deals', user?.id, role, limit],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('deals')
        .select(`
          id, title, value, deal_type, stage, updated_at,
          companies!deals_company_id_fkey (name)
        `)
        .in('stage', ['lead', 'qualified', 'proposal', 'negotiation'])
        .order('updated_at', { ascending: false })
        .limit(limit);
      
      if (role === 'sdr') {
        query = query.or(`owner_id.eq.${user.id},sdr_id.eq.${user.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((deal: any) => ({
        id: deal.id,
        title: deal.title,
        company: deal.companies?.name || 'Sem empresa',
        value: deal.value,
        deal_type: deal.deal_type,
        stage: deal.stage,
        daysInStage: Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
      })) as RecentDealData[];
    },
    enabled: !!user,
  });
}

// Fetch team performance (Admin only)
export function useTeamPerformance() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'team-performance', role],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      if (role !== 'admin') return [];

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all profiles with roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true);

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get deals closed this month
      const { data: closedDeals } = await supabase
        .from('deals')
        .select('closer_id, sdr_id, value, stage')
        .gte('actual_close_date', startOfMonth.toISOString().split('T')[0]);

      // Get leads created this month
      const { data: leadsCreated } = await supabase
        .from('deals')
        .select('owner_id, sdr_id')
        .gte('created_at', startOfMonth.toISOString());

      const performance: TeamMemberPerformance[] = [];

      (profiles || []).forEach((profile) => {
        const roleData = userRoles?.find(r => r.user_id === profile.id);
        if (!roleData) return;

        const initials = profile.full_name
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        if (roleData.role === 'closer') {
          // Closer: value of closed deals
          const myDeals = (closedDeals || []).filter(
            d => d.closer_id === profile.id && d.stage === 'closed_won'
          );
          const achieved = myDeals.reduce((sum, d) => sum + d.value, 0);

          performance.push({
            id: profile.id,
            name: profile.full_name,
            initials,
            role: 'Closer',
            target: 100000, // Default target
            achieved,
            deals: myDeals.length,
          });
        } else if (roleData.role === 'sdr') {
          // SDR: number of leads
          const myLeads = (leadsCreated || []).filter(
            d => d.sdr_id === profile.id || d.owner_id === profile.id
          );

          performance.push({
            id: profile.id,
            name: profile.full_name,
            initials,
            role: 'SDR',
            target: 50, // Default target (leads)
            achieved: myLeads.length,
            deals: myLeads.length,
            isLeads: true,
          });
        }
      });

      return performance;
    },
    enabled: !!user && role === 'admin',
  });
}

// Fetch revenue chart data
export function useRevenueChart() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'revenue-chart', user?.id, role],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const now = new Date();
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const chartData: RevenueChartData[] = [];

      // Get last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        // Fetch closed deals for this month
        let query = supabase
          .from('deals')
          .select('value')
          .eq('stage', 'closed_won')
          .gte('actual_close_date', monthDate.toISOString().split('T')[0])
          .lte('actual_close_date', monthEnd.toISOString().split('T')[0]);

        if (role === 'sdr') {
          query = query.or(`owner_id.eq.${user.id},sdr_id.eq.${user.id}`);
        }

        const { data } = await query;
        const revenue = (data || []).reduce((sum, d) => sum + d.value, 0);

        chartData.push({
          month: monthNames[monthDate.getMonth()],
          receita: revenue,
          projecao: revenue * 1.1, // Projection: 10% growth
        });
      }

      return chartData;
    },
    enabled: !!user,
  });
}
