import { AppLayout } from "@/components/layout";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { useState } from "react";

export type Deal = {
  id: string;
  company: string;
  contact: string;
  value: number;
  type: "retainer" | "project";
  daysInStage: number;
  probability: number;
};

export type Stage = {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
};

const initialStages: Stage[] = [
  {
    id: "lead",
    name: "Leads",
    color: "stage-lead",
    deals: [
      { id: "1", company: "Nova Tech", contact: "Carlos Souza", value: 25000, type: "retainer", daysInStage: 1, probability: 10 },
      { id: "2", company: "Digital Agency", contact: "Ana Paula", value: 18000, type: "project", daysInStage: 3, probability: 15 },
      { id: "3", company: "E-commerce Plus", contact: "Roberto Lima", value: 42000, type: "retainer", daysInStage: 2, probability: 10 },
    ],
  },
  {
    id: "qualified",
    name: "Qualificados",
    color: "stage-qualified",
    deals: [
      { id: "4", company: "TechCorp Solutions", contact: "Maria Silva", value: 35000, type: "retainer", daysInStage: 5, probability: 30 },
      { id: "5", company: "StartupXYZ", contact: "João Santos", value: 22000, type: "project", daysInStage: 4, probability: 35 },
    ],
  },
  {
    id: "proposal",
    name: "Proposta",
    color: "stage-proposal",
    deals: [
      { id: "6", company: "Grupo Varejo", contact: "Patricia Costa", value: 72000, type: "retainer", daysInStage: 3, probability: 50 },
      { id: "7", company: "FinTech Brasil", contact: "Lucas Oliveira", value: 45000, type: "project", daysInStage: 7, probability: 60 },
    ],
  },
  {
    id: "negotiation",
    name: "Negociação",
    color: "stage-negotiation",
    deals: [
      { id: "8", company: "MegaStore", contact: "Fernanda Lima", value: 85000, type: "retainer", daysInStage: 10, probability: 75 },
    ],
  },
  {
    id: "closed",
    name: "Fechado",
    color: "stage-closed",
    deals: [],
  },
];

export default function Pipeline() {
  const [stages, setStages] = useState<Stage[]>(initialStages);

  const totalValue = stages.reduce(
    (sum, stage) => sum + stage.deals.reduce((s, d) => s + d.value, 0),
    0
  );

  const weightedValue = stages.reduce(
    (sum, stage) =>
      sum + stage.deals.reduce((s, d) => s + d.value * (d.probability / 100), 0),
    0
  );

  return (
    <AppLayout title="Pipeline" subtitle="Gerencie seus deals e oportunidades">
      <div className="space-y-6">
        <PipelineHeader totalValue={totalValue} weightedValue={weightedValue} />
        <KanbanBoard stages={stages} setStages={setStages} />
      </div>
    </AppLayout>
  );
}
