import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar, Wallet, Briefcase, CheckCircle } from "lucide-react";
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

interface StatCard {
  name: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  icon: React.ComponentType<{ className?: string }>;
  variant: "accent" | "primary" | "default" | "success";
}

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
  const getStats = (): StatCard[] => {
    // Admin Dashboard Stats
    if (role === 'admin') {
      return [
        {
          name: "Receita Mensal",
          value: formatCurrency(metrics?.monthlyRevenue || 0),
          change: formatPercent(metrics?.monthlyRevenueChange || 0),
          changeType: (metrics?.monthlyRevenueChange || 0) >= 0 ? "positive" : "negative",
          icon: DollarSign,
          variant: "accent",
        },
        {
          name: "Deals em Pipeline",
          value: formatCurrency(metrics?.pipelineValue || 0),
          change: formatPercent(metrics?.pipelineValueChange || 0),
          changeType: (metrics?.pipelineValueChange || 0) >= 0 ? "positive" : "negative",
          icon: Target,
          variant: "primary",
        },
        {
          name: "Novos Leads",
          value: String(metrics?.newLeads || 0),
          change: formatPercent(metrics?.newLeadsChange || 0),
          changeType: (metrics?.newLeadsChange || 0) >= 0 ? "positive" : "negative",
          icon: Users,
          variant: "default",
        },
        {
          name: "Taxa de Conversão",
          value: `${(metrics?.conversionRate || 0).toFixed(1)}%`,
          change: formatPercent(metrics?.conversionRateChange || 0),
          changeType: (metrics?.conversionRateChange || 0) >= 0 ? "positive" : "negative",
          icon: Calendar,
          variant: "success",
        },
      ];
    }

    // Closer Dashboard Stats
    if (role === 'closer') {
      return [
        {
          name: "Meus Deals Ativos",
          value: String(metrics?.myActiveDeals || 0),
          icon: Briefcase,
          variant: "accent",
        },
        {
          name: "Meu Valor em Pipeline",
          value: formatCurrency(metrics?.myPipelineValue || 0),
          icon: Target,
          variant: "primary",
        },
        {
          name: "Minhas Comissões Pendentes",
          value: formatCurrency(metrics?.myPendingCommissions || 0),
          icon: Wallet,
          variant: "success",
        },
        {
          name: "Receita Fechada (Mês)",
          value: formatCurrency(metrics?.monthlyRevenue || 0),
          change: formatPercent(metrics?.monthlyRevenueChange || 0),
          changeType: (metrics?.monthlyRevenueChange || 0) >= 0 ? "positive" : "negative",
          icon: DollarSign,
          variant: "default",
        },
      ];
    }

    // SDR Dashboard Stats
    if (role === 'sdr') {
      return [
        {
          name: "Meus Leads",
          value: String(metrics?.myLeads || 0),
          icon: Users,
          variant: "accent",
        },
        {
          name: "Leads Qualificados",
          value: String(metrics?.myQualifiedLeads || 0),
          icon: CheckCircle,
          variant: "primary",
        },
        {
          name: "Comissões de Qualificação",
          value: formatCurrency(metrics?.myQualificationCommissions || 0),
          icon: Wallet,
          variant: "success",
        },
        {
          name: "Meu Pipeline",
          value: formatCurrency(metrics?.pipelineValue || 0),
          icon: Target,
          variant: "default",
        },
      ];
    }

    // Fallback
    return [];
  };

  const stats = getStats();

  const getVariantClasses = (variant: StatCard['variant']) => {
    switch (variant) {
      case 'accent':
        return {
          card: 'stat-card-accent',
          icon: 'bg-accent/20 text-accent'
        };
      case 'primary':
        return {
          card: 'stat-card-primary',
          icon: 'bg-primary/10 text-primary'
        };
      case 'success':
        return {
          card: 'stat-card',
          icon: 'bg-success/10 text-success'
        };
      default:
        return {
          card: 'stat-card',
          icon: 'bg-muted text-muted-foreground'
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const classes = getVariantClasses(stat.variant);
        
        return (
          <div
            key={stat.name}
            className={cn(
              "rounded-xl p-5 transition-all duration-200 hover:shadow-card-hover",
              classes.card
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", classes.icon)}>
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
        );
      })}
    </div>
  );
}
