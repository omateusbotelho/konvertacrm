import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePipelineOverview } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

const stageColors: Record<string, string> = {
  lead: "bg-stage-lead",
  qualified: "bg-stage-qualified",
  proposal: "bg-stage-proposal",
  negotiation: "bg-stage-negotiation",
};

export function PipelineOverview() {
  const { data: stages, isLoading } = usePipelineOverview();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Pipeline Ativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <Skeleton className="h-10 w-32 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto mt-2" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = (stages || []).reduce((sum, stage) => sum + stage.value, 0);
  const hasData = totalValue > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Pipeline Ativo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <p className="text-3xl font-bold text-foreground">
            R$ {totalValue.toLocaleString("pt-BR")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Valor total em pipeline</p>
        </div>
        
        {!hasData ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Nenhum deal ativo no pipeline</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(stages || []).map((stage) => {
              const percentage = totalValue > 0 ? (stage.value / totalValue) * 100 : 0;
              return (
                <div key={stage.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", stageColors[stage.stage] || "bg-muted-foreground")} />
                      <span className="font-medium">{stage.name}</span>
                      <span className="text-muted-foreground">({stage.count})</span>
                    </div>
                    <span className="font-medium">
                      R$ {(stage.value / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", stageColors[stage.stage] || "bg-muted-foreground")}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
