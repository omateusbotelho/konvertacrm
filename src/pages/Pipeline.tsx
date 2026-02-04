import { useState, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { PipelineFilters, DealOwnershipFilter, DealTypeFilter } from "@/components/pipeline/PipelineFilters";
import { DealModal } from "@/components/pipeline/DealModal";
import { CloseDealDialog, CloseLostData, CloseWonData } from "@/components/pipeline/CloseDealDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDealsByStage, useMoveDeal, DealWithCompany, DealFilters } from "@/hooks/useDeals";
import { useAuth } from "@/contexts/AuthContext";
import { validateDealMovement, DealStage } from "@/lib/deal-calculations";
import { toastError } from "@/lib/toast";

// Stage configuration
const STAGE_CONFIG: { id: DealStage; name: string; color: string }[] = [
  { id: "lead", name: "Leads", color: "stage-lead" },
  { id: "qualified", name: "Qualificados", color: "stage-qualified" },
  { id: "proposal", name: "Proposta", color: "stage-proposal" },
  { id: "negotiation", name: "Negociação", color: "stage-negotiation" },
  { id: "closed_won", name: "Fechado", color: "stage-closed" },
  { id: "closed_lost", name: "Perdido", color: "stage-lost" },
];

const stageColorMap: Record<string, string> = {
  "stage-lead": "bg-stage-lead",
  "stage-qualified": "bg-stage-qualified",
  "stage-proposal": "bg-stage-proposal",
  "stage-negotiation": "bg-stage-negotiation",
  "stage-closed": "bg-stage-closed",
  "stage-lost": "bg-stage-lost",
};

interface PendingMove {
  dealId: string;
  fromStageId: DealStage;
  toStageId: DealStage;
  deal: DealWithCompany;
}

// Deal Card Component
function DealCard({
  deal,
  stageId,
  stageColor,
  onDragStart,
  onClick,
}: {
  deal: DealWithCompany;
  stageId: string;
  stageColor: string;
  onDragStart: (e: React.DragEvent, dealId: string, stageId: string) => void;
  onClick?: () => void;
}) {
  // Calculate days in stage from updated_at
  const daysInStage = deal.updated_at 
    ? Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, deal.id, stageId)}
      onClick={onClick}
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card border-border"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {deal.companies?.name || deal.title}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              deal.deal_type === "retainer" 
                ? "border-accent/50 text-accent" 
                : "border-primary/50 text-primary"
            )}
          >
            {deal.deal_type === "retainer" ? "Retainer" : "Projeto"}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-1">{deal.title}</p>

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <p className="text-sm font-semibold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(deal.value)}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {daysInStage}d
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

// Kanban Column Component
function KanbanColumn({
  stageConfig,
  deals,
  onDragStart,
  onDrop,
  onDragOver,
  onAddDeal,
}: {
  stageConfig: { id: DealStage; name: string; color: string };
  deals: DealWithCompany[];
  onDragStart: (e: React.DragEvent, dealId: string, stageId: string) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onAddDeal?: () => void;
}) {
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div
      className="flex-shrink-0 w-72"
      onDrop={(e) => onDrop(e, stageConfig.id)}
      onDragOver={onDragOver}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", stageColorMap[stageConfig.color] || "bg-muted-foreground")} />
          <h3 className="font-medium text-sm">{stageConfig.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {deals.length}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalValue)}
        </span>
      </div>

      <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30 border border-dashed border-border">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            stageId={stageConfig.id}
            stageColor={stageConfig.color}
            onDragStart={onDragStart}
          />
        ))}
        
        {deals.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Nenhum deal</p>
            {stageConfig.id === 'lead' && onAddDeal && (
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={onAddDeal}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Pipeline Page
export default function Pipeline() {
  const { role, user } = useAuth();
  
  // Filter states
  const [ownershipFilter, setOwnershipFilter] = useState<DealOwnershipFilter>("all");
  const [typeFilter, setTypeFilter] = useState<DealTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Build filters object
  const filters: DealFilters = useMemo(() => ({
    ownership: ownershipFilter,
    dealType: typeFilter,
    searchQuery: searchQuery,
  }), [ownershipFilter, typeFilter, searchQuery]);

  const { stages, isLoading, error } = useDealsByStage(filters);
  const moveDeal = useMoveDeal();

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeDialogType, setCloseDialogType] = useState<'won' | 'lost'>('won');
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  // Calculate totals
  const totalValue = Object.values(stages).flat().reduce((sum, deal) => sum + deal.value, 0);
  const weightedValue = Object.values(stages).flat().reduce(
    (sum, deal) => sum + deal.value * ((deal.probability || 0) / 100),
    0
  );

  const handleDragStart = (e: React.DragEvent, dealId: string, fromStageId: string) => {
    e.dataTransfer.setData("dealId", dealId);
    e.dataTransfer.setData("fromStageId", fromStageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const findDealById = useCallback((dealId: string): { deal: DealWithCompany; stageId: DealStage } | null => {
    for (const [stageId, deals] of Object.entries(stages)) {
      const deal = deals.find((d) => d.id === dealId);
      if (deal) {
        return { deal, stageId: stageId as DealStage };
      }
    }
    return null;
  }, [stages]);

  const handleDrop = (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    const fromStageId = e.dataTransfer.getData("fromStageId") as DealStage;

    if (fromStageId === toStageId) return;

    const found = findDealById(dealId);
    if (!found) return;

    const { deal } = found;

    // Validate movement based on role
    const validation = validateDealMovement(
      role,
      fromStageId,
      toStageId as DealStage,
      true // TODO: check actual ownership
    );

    if (!validation.allowed) {
      toastError(validation.error || "Movimento não permitido");
      return;
    }

    // Check if we need additional data
    if (validation.requiresLossReason) {
      setPendingMove({ dealId, fromStageId, toStageId: toStageId as DealStage, deal });
      setCloseDialogType('lost');
      setCloseDialogOpen(true);
      return;
    }

    if (validation.requiresCloseDate) {
      setPendingMove({ dealId, fromStageId, toStageId: toStageId as DealStage, deal });
      setCloseDialogType('won');
      setCloseDialogOpen(true);
      return;
    }

    // Execute the move directly
    moveDeal.mutate({
      dealId,
      fromStage: fromStageId,
      toStage: toStageId as DealStage,
      dealData: deal,
    });
  };

  const handleCloseDialogConfirm = (data: CloseLostData | CloseWonData) => {
    if (!pendingMove) return;

    const { dealId, fromStageId, toStageId, deal } = pendingMove;

    if ('lossReason' in data) {
      moveDeal.mutate({
        dealId,
        fromStage: fromStageId,
        toStage: toStageId,
        dealData: deal,
        additionalData: {
          lossReason: data.lossReason,
          lossNotes: data.lossNotes,
          lossCompetitor: data.lossCompetitor,
        },
      });
    } else {
      moveDeal.mutate({
        dealId,
        fromStage: fromStageId,
        toStage: toStageId,
        dealData: deal,
        additionalData: {
          actualCloseDate: data.actualCloseDate,
          startRecurring: data.startRecurring,
        },
      });
    }

    setPendingMove(null);
  };

  if (error) {
    return (
      <AppLayout title="Pipeline" subtitle="Gerencie seus deals e oportunidades">
        <div className="text-center py-8 text-destructive">
          Erro ao carregar deals. Tente novamente.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Pipeline" subtitle="Gerencie seus deals e oportunidades">
      <div className="space-y-6">
        <PipelineHeader 
          totalValue={totalValue} 
          weightedValue={weightedValue}
          onNewDeal={() => setDealModalOpen(true)}
        />

        {/* Filters Section */}
        <PipelineFilters
          ownershipFilter={ownershipFilter}
          onOwnershipFilterChange={setOwnershipFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
        
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGE_CONFIG.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <Skeleton className="h-8 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGE_CONFIG.map((stageConfig) => (
              <KanbanColumn
                key={stageConfig.id}
                stageConfig={stageConfig}
                deals={stages[stageConfig.id] || []}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onAddDeal={() => setDealModalOpen(true)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Deal Modal */}
      <DealModal
        open={dealModalOpen}
        onOpenChange={setDealModalOpen}
        mode="create"
      />

      {/* Close Deal Dialog */}
      <CloseDealDialog
        open={closeDialogOpen}
        onOpenChange={(open) => {
          setCloseDialogOpen(open);
          if (!open) setPendingMove(null);
        }}
        type={closeDialogType}
        dealCompany={pendingMove?.deal.companies?.name || pendingMove?.deal.title || ''}
        dealValue={pendingMove?.deal.value}
        dealType={pendingMove?.deal.deal_type}
        onConfirm={handleCloseDialogConfirm}
      />
    </AppLayout>
  );
}
