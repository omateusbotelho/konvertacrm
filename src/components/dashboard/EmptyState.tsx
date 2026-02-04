import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, FileText } from "lucide-react";

type EmptyStateVariant = "chart" | "funnel" | "ranking" | "deals" | "team";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  className?: string;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, { icon: React.ComponentType<{ className?: string }>; title: string; description: string }> = {
  chart: {
    icon: BarChart3,
    title: "Sem dados no período",
    description: "Os dados aparecerão aqui quando houver atividade",
  },
  funnel: {
    icon: TrendingUp,
    title: "Pipeline vazio",
    description: "Crie deals para visualizar o funil de vendas",
  },
  ranking: {
    icon: Users,
    title: "Sem ranking disponível",
    description: "O ranking será exibido quando houver atividade de vendas",
  },
  deals: {
    icon: FileText,
    title: "Nenhum deal encontrado",
    description: "Crie novos deals para visualizá-los aqui",
  },
  team: {
    icon: Users,
    title: "Equipe não encontrada",
    description: "Adicione membros à equipe para acompanhar o desempenho",
  },
};

export function EmptyState({ variant = "chart", title, description, className }: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      className
    )}>
      {/* Decorative background */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/20 blur-2xl rounded-full scale-150" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border/50">
          <Icon className="h-8 w-8 text-muted-foreground/60" />
        </div>
      </div>
      
      {/* Text content */}
      <h3 className="text-sm font-medium text-foreground mb-1">
        {title || config.title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        {description || config.description}
      </p>
      
      {/* Decorative dots */}
      <div className="flex gap-1.5 mt-4">
        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
      </div>
    </div>
  );
}
