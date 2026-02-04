import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DollarSign, CheckCircle2, Clock, XCircle, MoreHorizontal,
  TrendingUp, Wallet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useCommissions, useCommissionMetrics, 
  useApproveCommission, usePayCommission, useCancelCommission,
  CommissionFilters
} from "@/hooks/useCommissions";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/30", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Aprovada", color: "bg-primary/10 text-primary border-primary/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  paid: { label: "Paga", color: "bg-success/10 text-success border-success/30", icon: <DollarSign className="h-3 w-3" /> },
  cancelled: { label: "Cancelada", color: "bg-destructive/10 text-destructive border-destructive/30", icon: <XCircle className="h-3 w-3" /> },
};

const typeLabels: Record<string, string> = {
  qualification: "Qualificação",
  closing: "Fechamento",
  delivery: "Entrega",
  referral: "Indicação",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function Commissions() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  
  const [statusFilter, setStatusFilter] = useState<CommissionFilters['status']>('all');
  const [typeFilter, setTypeFilter] = useState<CommissionFilters['type']>('all');

  const { data: commissions, isLoading } = useCommissions({ status: statusFilter, type: typeFilter });
  const { data: metrics, isLoading: metricsLoading } = useCommissionMetrics();
  
  const approveCommission = useApproveCommission();
  const payCommission = usePayCommission();
  const cancelCommission = useCancelCommission();

  return (
    <AppLayout title="Comissões" subtitle={isAdmin ? "Gerencie as comissões da equipe" : "Acompanhe suas comissões"}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card-accent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold">{formatCurrency(metrics?.totalPending || 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{metrics?.countPending || 0} comissões</p>
                    </>
                  )}
                </div>
                <Clock className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovadas</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold">{formatCurrency(metrics?.totalApproved || 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{metrics?.countApproved || 0} comissões</p>
                    </>
                  )}
                </div>
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card-success">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pago</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{formatCurrency(metrics?.totalPaid || 0)}</p>
                  )}
                </div>
                <Wallet className="h-8 w-8 text-success/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Geral</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatCurrency((metrics?.totalPending || 0) + (metrics?.totalApproved || 0) + (metrics?.totalPaid || 0))}
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v as CommissionFilters['status'])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="approved">Aprovadas</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v as CommissionFilters['type'])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="qualification">Qualificação</SelectItem>
              <SelectItem value="closing">Fechamento</SelectItem>
              <SelectItem value="delivery">Entrega</SelectItem>
              <SelectItem value="referral">Indicação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !commissions || commissions.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma comissão encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    {isAdmin && <TableHead>Usuário</TableHead>}
                    <TableHead>Tipo</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => {
                    const status = statusConfig[commission.status || 'pending'];
                    return (
                      <TableRow key={commission.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{commission.deals?.title || 'Deal desconhecido'}</p>
                            <p className="text-xs text-muted-foreground">
                              {commission.deals?.companies?.name || ''}
                            </p>
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>{commission.profiles?.full_name || 'Desconhecido'}</TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[commission.commission_type] || commission.commission_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(commission.base_value)}</TableCell>
                        <TableCell>{commission.percentage}%</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(commission.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", status.color)}>
                            <span className="mr-1">{status.icon}</span>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {commission.created_at 
                            ? format(parseISO(commission.created_at), "dd/MM/yyyy", { locale: ptBR })
                            : '-'}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {commission.status === 'pending' && (
                                  <DropdownMenuItem 
                                    onClick={() => approveCommission.mutate(commission.id)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Aprovar
                                  </DropdownMenuItem>
                                )}
                                {commission.status === 'approved' && (
                                  <DropdownMenuItem 
                                    onClick={() => payCommission.mutate(commission.id)}
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Marcar como Paga
                                  </DropdownMenuItem>
                                )}
                                {(commission.status === 'pending' || commission.status === 'approved') && (
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => cancelCommission.mutate({ id: commission.id })}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
