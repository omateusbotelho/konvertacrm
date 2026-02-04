import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stages = [
  { name: "Leads", count: 24, value: 156000, color: "bg-stage-lead" },
  { name: "Qualificados", count: 12, value: 98000, color: "bg-stage-qualified" },
  { name: "Proposta", count: 8, value: 64000, color: "bg-stage-proposal" },
  { name: "Negociação", count: 5, value: 24000, color: "bg-stage-negotiation" },
];

const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);

export function PipelineOverview() {
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
        
        <div className="space-y-3">
          {stages.map((stage) => {
            const percentage = (stage.value / totalValue) * 100;
            return (
              <div key={stage.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", stage.color)} />
                    <span className="font-medium">{stage.name}</span>
                    <span className="text-muted-foreground">({stage.count})</span>
                  </div>
                  <span className="font-medium">
                    R$ {(stage.value / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
