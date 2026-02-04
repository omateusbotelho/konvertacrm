import { useState } from 'react';
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Filter, MoreHorizontal, Mail, Upload, Loader2, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContacts } from '@/hooks/useContacts';
import { CSVImportModal, FieldDefinition } from '@/components/import';
import { useContactImport } from '@/hooks/useCSVImport';
import { useQueryClient } from '@tanstack/react-query';
import { toastSuccess } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const contactFields: FieldDefinition[] = [
  { key: 'full_name', label: 'Nome Completo', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Telefone', required: false },
  { key: 'position', label: 'Cargo', required: false },
  { key: 'company_name', label: 'Nome da Empresa', required: false },
  { key: 'linkedin_url', label: 'LinkedIn URL', required: false },
  { key: 'notes', label: 'Observações', required: false },
];

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { data: contacts, isLoading } = useContacts();
  const { importContacts } = useContactImport();
  const queryClient = useQueryClient();

  const filteredContacts = contacts?.filter(contact =>
    contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    toastSuccess('Importação concluída!');
  };

  const formatLastUpdate = (date: string | null) => {
    if (!date) return '-';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  return (
    <AppLayout title="Contatos" subtitle="Gerencie seus contatos e leads">
      <div className="space-y-4">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar contatos..." 
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
              Novo Contato
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum contato encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Tente outro termo de busca' : 'Comece adicionando seu primeiro contato'}
            </p>
            <Button onClick={() => setIsImportOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
          </div>
        ) : (
          /* Table */
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {contact.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{contact.full_name}</p>
                          {contact.email && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{contact.companies?.name || '-'}</TableCell>
                    <TableCell>{contact.position || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          contact.is_primary
                            ? "border-success/50 text-success bg-success/10"
                            : "border-primary/50 text-primary bg-primary/10"
                        }
                      >
                        {contact.is_primary ? 'Principal' : 'Ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLastUpdate(contact.updated_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Criar deal</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CSVImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Importar Contatos"
        description="Faça upload de um arquivo CSV para importar contatos em massa. Certifique-se de que as empresas já estejam cadastradas."
        fields={contactFields}
        onImport={importContacts}
        onComplete={handleImportComplete}
      />
    </AppLayout>
  );
}
