import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Filter, Building2, Users, DollarSign, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const companies = [
  {
    id: 1,
    name: "TechCorp Solutions",
    industry: "Tecnologia",
    contacts: 3,
    deals: 2,
    totalValue: 85000,
    status: "Cliente",
  },
  {
    id: 2,
    name: "StartupXYZ",
    industry: "SaaS",
    contacts: 2,
    deals: 1,
    totalValue: 22000,
    status: "Prospect",
  },
  {
    id: 3,
    name: "Grupo Varejo",
    industry: "Varejo",
    contacts: 5,
    deals: 1,
    totalValue: 72000,
    status: "Negociando",
  },
  {
    id: 4,
    name: "FinTech Brasil",
    industry: "Financeiro",
    contacts: 4,
    deals: 2,
    totalValue: 120000,
    status: "Cliente",
  },
  {
    id: 5,
    name: "MegaStore",
    industry: "E-commerce",
    contacts: 6,
    deals: 1,
    totalValue: 85000,
    status: "Negociando",
  },
  {
    id: 6,
    name: "Digital Agency",
    industry: "Marketing",
    contacts: 2,
    deals: 1,
    totalValue: 18000,
    status: "Lead",
  },
];

export default function Companies() {
  return (
    <AppLayout title="Empresas" subtitle="Gerencie suas contas e oportunidades">
      <div className="space-y-4">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar empresas..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="card-hover cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">{company.industry}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Criar deal</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant="outline"
                    className={
                      company.status === "Cliente"
                        ? "border-success/50 text-success bg-success/10"
                        : company.status === "Negociando"
                        ? "border-warning/50 text-warning bg-warning/10"
                        : company.status === "Lead"
                        ? "border-stage-lead/50 text-stage-lead bg-stage-lead/10"
                        : "border-primary/50 text-primary bg-primary/10"
                    }
                  >
                    {company.status}
                  </Badge>
                  <p className="text-lg font-bold">
                    R$ {(company.totalValue / 1000).toFixed(0)}k
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{company.contacts} contatos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    <span>{company.deals} deals</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
