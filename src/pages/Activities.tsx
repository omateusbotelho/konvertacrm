import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Plus, Filter, MoreHorizontal, Phone, Mail, Calendar, FileText, 
  CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities, useCompleteActivity, useDeleteActivity, ActivityFilters } from "@/hooks/useActivities";
import { cn } from "@/lib/utils";
import { format, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const activityTypeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  task: <CheckCircle2 className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
};

const activityTypeLabels: Record<string, string> = {
  call: "Ligação",
  meeting: "Reunião",
  email: "E-mail",
  task: "Tarefa",
  note: "Nota",
};

export default function Activities() {
  const [filter, setFilter] = useState<ActivityFilters['filter']>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const { data: activities, isLoading } = useActivities({ filter });
  const completeActivity = useCompleteActivity();
  const deleteActivity = useDeleteActivity();

  const filteredActivities = (activities || []).filter(activity =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOverdue = (dueDate: string | null, isCompleted: boolean | null) => {
    if (!dueDate || isCompleted) return false;
    return isAfter(new Date(), parseISO(dueDate));
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    return format(parseISO(dueDate), "dd MMM yyyy", { locale: ptBR });
  };

  return (
    <AppLayout title="Atividades" subtitle="Gerencie suas tarefas e compromissos">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="stat-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">
                    {(activities || []).filter(a => !a.is_completed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atrasadas</p>
                  <p className="text-2xl font-bold">
                    {(activities || []).filter(a => isOverdue(a.due_date, a.is_completed)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold">
                    {(activities || []).filter(a => a.is_completed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar atividades..." 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as ActivityFilters['filter'])}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="mine">Minhas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade encontrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity) => {
                  const overdue = isOverdue(activity.due_date, activity.is_completed);
                  return (
                    <Card key={activity.id} className={cn(
                      "transition-colors",
                      activity.is_completed && "opacity-60"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            activity.is_completed ? "bg-success/10 text-success" :
                            overdue ? "bg-destructive/10 text-destructive" :
                            "bg-primary/10 text-primary"
                          )}>
                            {activityTypeIcons[activity.type] || <FileText className="h-4 w-4" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "font-medium truncate",
                                activity.is_completed && "line-through"
                              )}>
                                {activity.title}
                              </p>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {activityTypeLabels[activity.type] || activity.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              {activity.deals?.title && (
                                <span>Deal: {activity.deals.title}</span>
                              )}
                              {activity.companies?.name && (
                                <span>Empresa: {activity.companies.name}</span>
                              )}
                              {activity.due_date && (
                                <span className={cn(overdue && "text-destructive font-medium")}>
                                  Vence: {formatDueDate(activity.due_date)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!activity.is_completed && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => completeActivity.mutate(activity.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Concluir
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => deleteActivity.mutate(activity.id)}
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
