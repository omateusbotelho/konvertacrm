import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentDeals } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

const stageConfig: Record<string, { label: string; color: string }> = {
  lead: { label: "Lead", color: "stage-lead" },
  qualified: { label: "Qualificado", color: "stage-qualified" },
  proposal: { label: "Proposta", color: "stage-proposal" },
  negotiation: { label: "Negociação", color: "stage-negotiation" },
};

export function RecentDeals() {
  const { data: deals, isLoading } = useRecentDeals(5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Deals Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasDeals = deals && deals.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Deals Recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasDeals ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum deal ativo encontrado</p>
          </div>
        ) : (
          deals.map((deal) => {
            const stageInfo = stageConfig[deal.stage] || { label: deal.stage, color: "stage-lead" };
            return (
              <div
                key={deal.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{deal.company}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {deal.deal_type === 'retainer' ? 'Retainer' : 'Projeto'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {deal.daysInStage}d no estágio
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    R$ {deal.value.toLocaleString("pt-BR")}
                  </p>
                  <Badge className={cn("text-xs mt-1", stageInfo.color)}>
                    {stageInfo.label}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
