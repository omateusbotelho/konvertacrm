import { Deal } from "@/pages/Pipeline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: Deal;
  stageId: string;
  stageColor: string;
  onDragStart: (e: React.DragEvent, dealId: string, stageId: string) => void;
}

export function DealCard({ deal, stageId, stageColor, onDragStart }: DealCardProps) {
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, deal.id, stageId)}
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card border-border"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {deal.company}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              deal.type === "retainer" 
                ? "border-accent/50 text-accent" 
                : "border-primary/50 text-primary"
            )}
          >
            {deal.type === "retainer" ? "Retainer" : "Projeto"}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {deal.contact}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <p className="text-sm font-semibold">
            R$ {deal.value.toLocaleString("pt-BR")}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {deal.daysInStage}d
            </div>
            <div className="text-xs font-medium text-accent">
              {deal.probability}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
