import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DealStage, getStageProbability } from '@/lib/deal-calculations';

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
  // Role-specific metrics
  myActiveDeals?: number;
  myPipelineValue?: number;
  myPendingCommissions?: number;
  myLeads?: number;
  myQualifiedLeads?: number;
  myQualificationCommissions?: number;
}

// Pipeline stage data
export interface PipelineStageData {
  stage: DealStage;
  name: string;
  count: number;
  value: number;
}

// Funnel data
export interface FunnelData {
  stage: string;
  name: string;
  count: number;
  totalValue: number;
}

// Cash flow data
export interface CashFlowData {
  month: string;
  receitaReal: number;
  receitaProjetada: number;
}

// Sales ranking
export interface SalesRankingData {
  closers: {
    id: string;
    name: string;
    initials: string;
    totalValue: number;
    dealsCount: number;
  }[];
  sdrs: {
    id: string;
    name: string;
    initials: string;
    qualifiedCount: number;
    totalValue: number;
  }[];
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
        .select('amount, commission_type')
        .eq('status', 'pending');
      
      if (role !== 'admin') {
        commissionsQuery = commissionsQuery.eq('user_id', user.id);
      }

      const { data: pendingComm } = await commissionsQuery;
      const pendingCommissions = (pendingComm || []).reduce((sum, c) => sum + c.amount, 0);

      // Role-specific metrics
      let myActiveDeals = 0;
      let myPipelineValue = 0;
      let myPendingCommissions = 0;
      let myLeads = 0;
      let myQualifiedLeads = 0;
      let myQualificationCommissions = 0;

      if (role === 'closer') {
        // Closer: My active deals (where I'm owner or closer)
        const myDeals = (allDeals || []).filter(d => 
          (d.owner_id === user.id || d.closer_id === user.id) &&
          activeStages.includes(d.stage as DealStage)
        );
        myActiveDeals = myDeals.length;
        myPipelineValue = myDeals.reduce((sum, d) => sum + d.value, 0);
        myPendingCommissions = pendingCommissions;
      } else if (role === 'sdr') {
        // SDR: My leads and qualified leads
        const myLeadsDeals = (allDeals || []).filter(d => 
          (d.owner_id === user.id || d.sdr_id === user.id) && 
          d.stage === 'lead'
        );
        myLeads = myLeadsDeals.length;

        const myQualifiedDeals = (allDeals || []).filter(d => 
          (d.owner_id === user.id || d.sdr_id === user.id) && 
          d.stage === 'qualified'
        );
        myQualifiedLeads = myQualifiedDeals.length;

        // Qualification commissions only
        myQualificationCommissions = (pendingComm || [])
          .filter(c => c.commission_type === 'qualification')
          .reduce((sum, c) => sum + c.amount, 0);
      }

      return {
        monthlyRevenue,
        monthlyRevenueChange,
        pipelineValue,
        pipelineValueChange: 0,
        newLeads: newLeadsThisMonth,
        newLeadsChange,
        conversionRate,
        conversionRateChange: 0,
        pendingCommissions,
        // Role-specific
        myActiveDeals,
        myPipelineValue,
        myPendingCommissions,
        myLeads,
        myQualifiedLeads,
        myQualificationCommissions,
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

// Fetch sales funnel data (all stages including closed)
export function useSalesFunnel() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'sales-funnel', user?.id, role],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase.from('deals').select('stage, value');
      
      if (role === 'sdr') {
        query = query.or(`owner_id.eq.${user.id},sdr_id.eq.${user.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stageNames: Record<string, string> = {
        lead: 'Leads',
        qualified: 'Qualificados',
        proposal: 'Proposta',
        negotiation: 'Negociação',
        closed_won: 'Fechado Won',
        closed_lost: 'Fechado Lost',
      };

      const stageOrder: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

      const stagesMap: Record<string, { count: number; totalValue: number }> = {};
      stageOrder.forEach(stage => {
        stagesMap[stage] = { count: 0, totalValue: 0 };
      });

      (data || []).forEach((deal) => {
        if (stagesMap[deal.stage]) {
          stagesMap[deal.stage].count += 1;
          stagesMap[deal.stage].totalValue += deal.value;
        }
      });

      return stageOrder.map(stage => ({
        stage,
        name: stageNames[stage] || stage,
        count: stagesMap[stage].count,
        totalValue: stagesMap[stage].totalValue,
      })) as FunnelData[];
    },
    enabled: !!user,
  });
}

// Fetch cash flow data (real vs projected)
export function useCashFlow() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'cash-flow', user?.id, role],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const now = new Date();
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const chartData: CashFlowData[] = [];

      // Get last 6 months + next 3 months for projection
      for (let i = 5; i >= -3; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const isPast = i > 0 || (i === 0 && now.getDate() > 15);
        const isFuture = i < 0;
        
        let receitaReal = 0;
        let receitaProjetada = 0;

        // Real revenue: paid invoices
        if (!isFuture) {
          const { data: paidInvoices } = await supabase
            .from('invoices')
            .select('amount')
            .eq('status', 'paid')
            .gte('payment_date', monthDate.toISOString().split('T')[0])
            .lte('payment_date', monthEnd.toISOString().split('T')[0]);

          receitaReal = (paidInvoices || []).reduce((sum, inv) => sum + inv.amount, 0);
        }

        // Projected revenue: deals in pipeline with expected_close_date in this month
        const { data: pipelineDeals } = await supabase
          .from('deals')
          .select('value, probability, stage')
          .not('stage', 'in', '("closed_won","closed_lost")')
          .gte('expected_close_date', monthDate.toISOString().split('T')[0])
          .lte('expected_close_date', monthEnd.toISOString().split('T')[0]);

        receitaProjetada = (pipelineDeals || []).reduce((sum, deal) => {
          const prob = deal.probability || getStageProbability(deal.stage as DealStage);
          return sum + (deal.value * (prob / 100));
        }, 0);

        // For past months, if we have real data, add closed_won deals to projection for comparison
        if (isPast) {
          const { data: closedDeals } = await supabase
            .from('deals')
            .select('value')
            .eq('stage', 'closed_won')
            .gte('actual_close_date', monthDate.toISOString().split('T')[0])
            .lte('actual_close_date', monthEnd.toISOString().split('T')[0]);

          const closedValue = (closedDeals || []).reduce((sum, d) => sum + d.value, 0);
          // For past months, projection shows what was expected vs what happened
          receitaProjetada = Math.max(receitaProjetada, closedValue);
        }

        chartData.push({
          month: monthNames[monthDate.getMonth()],
          receitaReal: isPast ? receitaReal : 0,
          receitaProjetada,
        });
      }

      return chartData;
    },
    enabled: !!user && role === 'admin',
  });
}

// Fetch sales ranking (Closers and SDRs)
export function useSalesRanking() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'sales-ranking', role],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      if (role !== 'admin') return { closers: [], sdrs: [] };

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all profiles
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
        .eq('stage', 'closed_won')
        .gte('actual_close_date', startOfMonth.toISOString().split('T')[0]);

      // Get deals qualified this month (for SDRs)
      const { data: qualifiedDeals } = await supabase
        .from('deals')
        .select('sdr_id, owner_id, value')
        .in('stage', ['qualified', 'proposal', 'negotiation', 'closed_won'])
        .gte('updated_at', startOfMonth.toISOString());

      const closers: SalesRankingData['closers'] = [];
      const sdrs: SalesRankingData['sdrs'] = [];

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
          const myDeals = (closedDeals || []).filter(d => d.closer_id === profile.id);
          const totalValue = myDeals.reduce((sum, d) => sum + d.value, 0);

          if (myDeals.length > 0) {
            closers.push({
              id: profile.id,
              name: profile.full_name,
              initials,
              totalValue,
              dealsCount: myDeals.length,
            });
          }
        } else if (roleData.role === 'sdr') {
          const myQualified = (qualifiedDeals || []).filter(
            d => d.sdr_id === profile.id || d.owner_id === profile.id
          );
          const totalValue = myQualified.reduce((sum, d) => sum + d.value, 0);

          if (myQualified.length > 0) {
            sdrs.push({
              id: profile.id,
              name: profile.full_name,
              initials,
              qualifiedCount: myQualified.length,
              totalValue,
            });
          }
        }
      });

      return { closers, sdrs } as SalesRankingData;
    },
    enabled: !!user && role === 'admin',
  });
}
