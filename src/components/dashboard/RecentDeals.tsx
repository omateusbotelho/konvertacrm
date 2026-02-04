import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const deals = [
  {
    id: 1,
    company: "TechCorp Solutions",
    value: 45000,
    type: "Retainer",
    stage: "Proposta",
    stageColor: "stage-proposal",
    daysInStage: 3,
  },
  {
    id: 2,
    company: "E-commerce Brasil",
    value: 28000,
    type: "Projeto",
    stage: "Negociação",
    stageColor: "stage-negotiation",
    daysInStage: 7,
  },
  {
    id: 3,
    company: "StartupXYZ",
    value: 15000,
    type: "Retainer",
    stage: "Qualificado",
    stageColor: "stage-qualified",
    daysInStage: 2,
  },
  {
    id: 4,
    company: "Grupo Varejo",
    value: 72000,
    type: "Projeto",
    stage: "Proposta",
    stageColor: "stage-proposal",
    daysInStage: 5,
  },
];

export function RecentDeals() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Deals Recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deals.map((deal) => (
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
                    {deal.type}
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
              <Badge className={cn("text-xs mt-1", deal.stageColor)}>
                {deal.stage}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
