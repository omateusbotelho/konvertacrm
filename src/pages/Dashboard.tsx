import { AppLayout } from "@/components/layout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { PipelineOverview } from "@/components/dashboard/PipelineOverview";
import { RecentDeals } from "@/components/dashboard/RecentDeals";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do seu negócio">
      <div className="space-y-6">
        <StatsCards />
        
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
          <TeamPerformance />
        </div>
      </div>
    </AppLayout>
  );
}
