import { Stage, Deal } from "@/pages/Pipeline";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  stages: Stage[];
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
}

export function KanbanBoard({ stages, setStages }: KanbanBoardProps) {
  const handleDragStart = (e: React.DragEvent, dealId: string, fromStageId: string) => {
    e.dataTransfer.setData("dealId", dealId);
    e.dataTransfer.setData("fromStageId", fromStageId);
  };

  const handleDrop = (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    const fromStageId = e.dataTransfer.getData("fromStageId");

    if (fromStageId === toStageId) return;

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
      const probabilityMap: Record<string, number> = {
        lead: 10,
        qualified: 30,
        proposal: 50,
        negotiation: 75,
        closed: 100,
      };
      deal.probability = probabilityMap[toStageId] || deal.probability;
      
      toStage.deals.push(deal);

      return newStages;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
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
  );
}
