import { useState } from 'react';
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Filter, Building2, Users, DollarSign, MoreHorizontal, Upload, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompanies } from '@/hooks/useCompanies';
import { CSVImportModal, FieldDefinition } from '@/components/import';
import { useCompanyImport } from '@/hooks/useCSVImport';
import { useQueryClient } from '@tanstack/react-query';
import { toastSuccess } from '@/lib/toast';

const companyFields: FieldDefinition[] = [
  { key: 'name', label: 'Nome da Empresa', required: true },
  { key: 'legal_name', label: 'Razão Social', required: false },
  { key: 'cnpj', label: 'CNPJ', required: false },
  { key: 'industry', label: 'Setor', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'company_size', label: 'Porte da Empresa', required: false },
  { key: 'address_street', label: 'Endereço', required: false },
  { key: 'address_city', label: 'Cidade', required: false },
  { key: 'address_state', label: 'Estado', required: false },
  { key: 'address_zip', label: 'CEP', required: false },
  { key: 'notes', label: 'Observações', required: false },
];

export default function Companies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { data: companies, isLoading } = useCompanies();
  const { importCompanies } = useCompanyImport();
  const queryClient = useQueryClient();

  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    toastSuccess('Importação concluída!');
  };

  return (
    <AppLayout title="Empresas" subtitle="Gerencie suas contas e oportunidades">
      <div className="space-y-4">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar empresas..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
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

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Tente outro termo de busca' : 'Comece adicionando sua primeira empresa'}
            </p>
            <Button onClick={() => setIsImportOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
          </div>
        ) : (
          /* Cards grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="card-hover cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">{company.industry || 'Sem setor'}</p>
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
                    {company.company_size && (
                      <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                        {company.company_size}
                      </Badge>
                    )}
                    {company.cnpj && (
                      <p className="text-sm text-muted-foreground">
                        {company.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
                    {company.website && (
                      <a 
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {company.website}
                      </a>
                    )}
                    {company.address_city && company.address_state && (
                      <span>{company.address_city}, {company.address_state}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CSVImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Importar Empresas"
        description="Faça upload de um arquivo CSV para importar empresas em massa."
        fields={companyFields}
        onImport={importCompanies}
        onComplete={handleImportComplete}
      />
    </AppLayout>
  );
}
