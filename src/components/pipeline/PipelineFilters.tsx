import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export type DealOwnershipFilter = "all" | "mine";
export type DealTypeFilter = "all" | "retainer" | "project";

interface PipelineFiltersProps {
  ownershipFilter: DealOwnershipFilter;
  onOwnershipFilterChange: (value: DealOwnershipFilter) => void;
  typeFilter: DealTypeFilter;
  onTypeFilterChange: (value: DealTypeFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export function PipelineFilters({
  ownershipFilter,
  onOwnershipFilterChange,
  typeFilter,
  onTypeFilterChange,
  searchQuery,
  onSearchQueryChange,
}: PipelineFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Ownership Filter */}
      <Select
        value={ownershipFilter}
        onValueChange={(value) => onOwnershipFilterChange(value as DealOwnershipFilter)}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Filtrar por..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Deals</SelectItem>
          <SelectItem value="mine">Meus Deals</SelectItem>
        </SelectContent>
      </Select>

      {/* Type Filter */}
      <Select
        value={typeFilter}
        onValueChange={(value) => onTypeFilterChange(value as DealTypeFilter)}
      >
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Tipo de Deal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          <SelectItem value="retainer">Retainer</SelectItem>
          <SelectItem value="project">Projeto</SelectItem>
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou empresa..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
    </div>
  );
}
