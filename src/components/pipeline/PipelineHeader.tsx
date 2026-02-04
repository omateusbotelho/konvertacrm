import { Button } from "@/components/ui/button";
import { Plus, Filter, SlidersHorizontal } from "lucide-react";

interface PipelineHeaderProps {
  totalValue: number;
  weightedValue: number;
}

export function PipelineHeader({ totalValue, weightedValue }: PipelineHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Valor Total</p>
          <p className="text-2xl font-bold">R$ {totalValue.toLocaleString("pt-BR")}</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground">Valor Ponderado</p>
          <p className="text-2xl font-bold text-accent">
            R$ {weightedValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtrar
        </Button>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Visualização
        </Button>
        <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Novo Deal
        </Button>
      </div>
    </div>
  );
}
