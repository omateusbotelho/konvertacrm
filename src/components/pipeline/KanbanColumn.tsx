import { Stage } from "@/pages/Pipeline";
import { DealCard } from "./DealCard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
  stage: Stage;
  onDragStart: (e: React.DragEvent, dealId: string, stageId: string) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
}

const stageColorMap: Record<string, string> = {
  "stage-lead": "bg-stage-lead",
  "stage-qualified": "bg-stage-qualified",
  "stage-proposal": "bg-stage-proposal",
  "stage-negotiation": "bg-stage-negotiation",
  "stage-closed": "bg-stage-closed",
  "stage-lost": "bg-stage-lost",
};

export function KanbanColumn({ stage, onDragStart, onDrop, onDragOver }: KanbanColumnProps) {
  const totalValue = stage.deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div
      className="flex-shrink-0 w-72"
      onDrop={(e) => onDrop(e, stage.id)}
      onDragOver={onDragOver}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", stageColorMap[stage.color] || "bg-muted-foreground")} />
          <h3 className="font-medium text-sm">{stage.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {stage.deals.length}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          R$ {(totalValue / 1000).toFixed(0)}k
        </span>
      </div>

      <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30 border border-dashed border-border">
        {stage.deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            stageId={stage.id}
            stageColor={stage.color}
            onDragStart={onDragStart}
          />
        ))}
        
        {stage.deals.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Nenhum deal</p>
            <Button variant="ghost" size="sm" className="mt-2 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
