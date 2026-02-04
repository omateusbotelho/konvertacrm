import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    name: "Receita Mensal",
    value: "R$ 127.500",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: DollarSign,
    variant: "accent" as const,
  },
  {
    name: "Deals em Pipeline",
    value: "R$ 342.000",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: Target,
    variant: "primary" as const,
  },
  {
    name: "Novos Leads",
    value: "48",
    change: "+23.1%",
    changeType: "positive" as const,
    icon: Users,
    variant: "default" as const,
  },
  {
    name: "Taxa de Conversão",
    value: "24.3%",
    change: "-2.4%",
    changeType: "negative" as const,
    icon: Calendar,
    variant: "default" as const,
  },
];

export function StatsCards() {
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
        </div>
      ))}
    </div>
  );
}
