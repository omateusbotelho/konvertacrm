import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardMetrics } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

export function StatsCards() {
  const { role } = useAuth();
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl p-5 stat-card">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <div className="mt-3 flex items-center gap-1">
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Define stats based on role
  const getStats = () => {
    const baseStats = [
      {
        name: role === 'sdr' ? "Minha Receita" : "Receita Mensal",
        value: formatCurrency(metrics?.monthlyRevenue || 0),
        change: formatPercent(metrics?.monthlyRevenueChange || 0),
        changeType: (metrics?.monthlyRevenueChange || 0) >= 0 ? "positive" as const : "negative" as const,
        icon: DollarSign,
        variant: "accent" as const,
      },
      {
        name: role === 'sdr' ? "Meu Pipeline" : "Deals em Pipeline",
        value: formatCurrency(metrics?.pipelineValue || 0),
        change: formatPercent(metrics?.pipelineValueChange || 0),
        changeType: (metrics?.pipelineValueChange || 0) >= 0 ? "positive" as const : "negative" as const,
        icon: Target,
        variant: "primary" as const,
      },
      {
        name: role === 'sdr' ? "Meus Leads" : "Novos Leads",
        value: String(metrics?.newLeads || 0),
        change: formatPercent(metrics?.newLeadsChange || 0),
        changeType: (metrics?.newLeadsChange || 0) >= 0 ? "positive" as const : "negative" as const,
        icon: Users,
        variant: "default" as const,
      },
    ];

    // Admin sees conversion rate, others see pending commissions
    if (role === 'admin') {
      baseStats.push({
        name: "Taxa de Conversão",
        value: `${(metrics?.conversionRate || 0).toFixed(1)}%`,
        change: formatPercent(metrics?.conversionRateChange || 0),
        changeType: (metrics?.conversionRateChange || 0) >= 0 ? "positive" as const : "negative" as const,
        icon: Calendar,
        variant: "default" as const,
      });
    } else {
      baseStats.push({
        name: "Comissões Pendentes",
        value: formatCurrency(metrics?.pendingCommissions || 0),
        change: "",
        changeType: "positive" as const,
        icon: Wallet,
        variant: "default" as const,
      });
    }

    return baseStats;
  };

  const stats = getStats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className={cn(
            "rounded-xl p-5 transition-all duration-200 hover:shadow-card-hover",
            stat.variant === "accent" && "stat-card-accent",
            stat.variant === "primary" && "stat-card-primary",
            stat.variant === "default" && "stat-card"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              stat.variant === "accent" && "bg-accent/20 text-accent",
              stat.variant === "primary" && "bg-primary/10 text-primary",
              stat.variant === "default" && "bg-muted text-muted-foreground"
            )}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
          {stat.change && (
            <div className="mt-3 flex items-center gap-1">
              {stat.changeType === "positive" ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={cn(
                "text-sm font-medium",
                stat.changeType === "positive" ? "text-success" : "text-destructive"
              )}>
                {stat.change}
              </span>
              <span className="text-sm text-muted-foreground">vs mês anterior</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
