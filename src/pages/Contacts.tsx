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
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const contacts = [
  {
    id: 1,
    name: "Maria Silva",
    email: "maria@techcorp.com",
    phone: "(11) 99999-1234",
    company: "TechCorp Solutions",
    role: "Diretora de Marketing",
    status: "Ativo",
    lastContact: "Hoje",
  },
  {
    id: 2,
    name: "João Santos",
    email: "joao@startupxyz.com",
    phone: "(11) 98888-5678",
    company: "StartupXYZ",
    role: "CEO",
    status: "Ativo",
    lastContact: "Ontem",
  },
  {
    id: 3,
    name: "Ana Costa",
    email: "ana@grupovarejo.com",
    phone: "(21) 97777-9012",
    company: "Grupo Varejo",
    role: "Gerente Comercial",
    status: "Lead",
    lastContact: "Há 3 dias",
  },
  {
    id: 4,
    name: "Carlos Souza",
    email: "carlos@fintechbrasil.com",
    phone: "(11) 96666-3456",
    company: "FinTech Brasil",
    role: "Head de Growth",
    status: "Ativo",
    lastContact: "Há 1 semana",
  },
  {
    id: 5,
    name: "Patricia Lima",
    email: "patricia@megastore.com",
    phone: "(11) 95555-7890",
    company: "MegaStore",
    role: "CMO",
    status: "Cliente",
    lastContact: "Hoje",
  },
];

export default function Contacts() {
  return (
    <AppLayout title="Contatos" subtitle="Gerencie seus contatos e leads">
      <div className="space-y-4">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar contatos..." className="pl-9" />
          </div>
          <div className="flex gap-2">
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

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {contact.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>{contact.role}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        contact.status === "Cliente"
                          ? "border-success/50 text-success bg-success/10"
                          : contact.status === "Lead"
                          ? "border-warning/50 text-warning bg-warning/10"
                          : "border-primary/50 text-primary bg-primary/10"
                      }
                    >
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.lastContact}</TableCell>
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
      </div>
    </AppLayout>
  );
}
