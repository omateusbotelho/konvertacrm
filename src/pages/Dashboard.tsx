import { AppLayout } from "@/components/layout";
import { 
  StatsCards, 
  RevenueChart, 
  PipelineOverview, 
  RecentDeals, 
  TeamPerformance,
  SalesFunnel,
  CashFlowChart,
  SalesRanking
} from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do seu negócio">
      <div className="space-y-6">
        <StatsCards />
        
        {/* Admin Dashboard: Full view with all charts */}
        {isAdmin && (
          <>
            {/* Row 1: Cash Flow (large) + Sales Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CashFlowChart />
              </div>
              <div>
                <SalesFunnel />
              </div>
            </div>

            {/* Row 2: Pipeline Overview + Sales Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PipelineOverview />
              <SalesRanking />
            </div>

            {/* Row 3: Recent Deals + Team Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentDeals />
              <TeamPerformance />
            </div>
          </>
        )}

        {/* Closer/SDR Dashboard: Simplified view */}
        {!isAdmin && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RevenueChart />
              </div>
              <div>
                <PipelineOverview />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentDeals />
              <SalesFunnel />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
