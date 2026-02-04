import { useState, useCallback } from "react";
import { Stage, Deal } from "@/pages/Pipeline";
import { KanbanColumn } from "./KanbanColumn";
import { CloseDealDialog, CloseLostData, CloseWonData } from "./CloseDealDialog";
import { useAuth } from "@/contexts/AuthContext";
import { validateDealMovement, DealStage, getStageProbability } from "@/lib/deal-calculations";
import { useToast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  stages: Stage[];
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
}

interface PendingMove {
  dealId: string;
  fromStageId: string;
  toStageId: string;
  deal: Deal;
}

export function KanbanBoard({ stages, setStages }: KanbanBoardProps) {
  const { role } = useAuth();
  const { toast } = useToast();
  
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeDialogType, setCloseDialogType] = useState<'won' | 'lost'>('won');
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const handleDragStart = (e: React.DragEvent, dealId: string, fromStageId: string) => {
    e.dataTransfer.setData("dealId", dealId);
    e.dataTransfer.setData("fromStageId", fromStageId);
  };

  const executeDealMove = useCallback((
    dealId: string,
    fromStageId: string,
    toStageId: string,
    additionalData?: Partial<{
      lossReason: string;
      lossNotes: string;
      lossCompetitor: string;
      actualCloseDate: string;
    }>
  ) => {
    setStages((prevStages) => {
      const newStages = [...prevStages];
      const fromStage = newStages.find((s) => s.id === fromStageId);
      const toStage = newStages.find((s) => s.id === toStageId);

      if (!fromStage || !toStage) return prevStages;

      const dealIndex = fromStage.deals.findIndex((d) => d.id === dealId);
      if (dealIndex === -1) return prevStages;

      const [deal] = fromStage.deals.splice(dealIndex, 1);
      deal.daysInStage = 0;
      
      // Update probability based on stage
      deal.probability = getStageProbability(toStageId as DealStage);
      
      // Apply additional data for closed deals
      if (additionalData) {
        Object.assign(deal, additionalData);
      }
      
      toStage.deals.push(deal);

      return newStages;
    });
  }, [setStages]);

  const handleDrop = (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    const fromStageId = e.dataTransfer.getData("fromStageId");

    if (fromStageId === toStageId) return;

    // Find the deal for ownership check
    const fromStage = stages.find((s) => s.id === fromStageId);
    const deal = fromStage?.deals.find((d) => d.id === dealId);
    
    if (!deal) return;

    // Validate movement based on role
    const validation = validateDealMovement(
      role,
      fromStageId as DealStage,
      toStageId as DealStage,
      true // TODO: check actual ownership with auth.uid() === deal.owner_id
    );

    if (!validation.allowed) {
      toast({
        title: "Movimento não permitido",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Check if we need additional data
    if (validation.requiresLossReason) {
      setPendingMove({ dealId, fromStageId, toStageId, deal });
      setCloseDialogType('lost');
      setCloseDialogOpen(true);
      return;
    }

    if (validation.requiresCloseDate) {
      setPendingMove({ dealId, fromStageId, toStageId, deal });
      setCloseDialogType('won');
      setCloseDialogOpen(true);
      return;
    }

    // Execute the move directly
    executeDealMove(dealId, fromStageId, toStageId);
  };

  const handleCloseDialogConfirm = (data: CloseLostData | CloseWonData) => {
    if (!pendingMove) return;

    const { dealId, fromStageId, toStageId } = pendingMove;

    if ('lossReason' in data) {
      executeDealMove(dealId, fromStageId, toStageId, {
        lossReason: data.lossReason,
        lossNotes: data.lossNotes,
        lossCompetitor: data.lossCompetitor,
      });
    } else {
      executeDealMove(dealId, fromStageId, toStageId, {
        actualCloseDate: data.actualCloseDate,
      });
    }

    setPendingMove(null);
    
    toast({
      title: closeDialogType === 'won' ? "Deal fechado!" : "Deal marcado como perdido",
      description: closeDialogType === 'won' 
        ? "O deal foi movido para Fechado Won." 
        : "O motivo da perda foi registrado.",
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        ))}
      </div>

      <CloseDealDialog
        open={closeDialogOpen}
        onOpenChange={(open) => {
          setCloseDialogOpen(open);
          if (!open) setPendingMove(null);
        }}
        type={closeDialogType}
        dealCompany={pendingMove?.deal.company || ''}
        onConfirm={handleCloseDialogConfirm}
      />
    </>
  );
}
