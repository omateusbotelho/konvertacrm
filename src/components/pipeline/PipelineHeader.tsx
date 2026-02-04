import { Button } from "@/components/ui/button";
import { Plus, Filter, SlidersHorizontal } from "lucide-react";

interface PipelineHeaderProps {
  totalValue: number;
  weightedValue: number;
  onNewDeal?: () => void;
}

export function PipelineHeader({ totalValue, weightedValue, onNewDeal }: PipelineHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Valor Total</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(totalValue)}
          </p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground">Valor Ponderado</p>
          <p className="text-2xl font-bold text-accent">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(weightedValue)}
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
        <Button 
          size="sm" 
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={onNewDeal}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Deal
        </Button>
      </div>
    </div>
  );
}
