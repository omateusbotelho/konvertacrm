import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const cashFlowData = [
  { month: "Jan", entrada: 95000, saida: 72000 },
  { month: "Fev", entrada: 102000, saida: 78000 },
  { month: "Mar", entrada: 98000, saida: 81000 },
  { month: "Abr", entrada: 115000, saida: 85000 },
  { month: "Mai", entrada: 121000, saida: 88000 },
  { month: "Jun", entrada: 127500, saida: 92000 },
];

const commissionsData = [
  { name: "Maria Silva", value: 8750, deals: 3 },
  { name: "João Santos", value: 6200, deals: 2 },
  { name: "Ana Costa", value: 4200, deals: 5 },
  { name: "Pedro Lima", value: 3800, deals: 4 },
];

const upcomingPayments = [
  { company: "TechCorp", value: 15000, type: "Retainer", dueDate: "05 Fev" },
  { company: "StartupXYZ", value: 8000, type: "Projeto", dueDate: "10 Fev" },
  { company: "Grupo Varejo", value: 22000, type: "Retainer", dueDate: "15 Fev" },
  { company: "FinTech Brasil", value: 12000, type: "Retainer", dueDate: "20 Fev" },
];

export default function Financial() {
  return (
    <AppLayout title="Financeiro" subtitle="Controle de receita, despesas e comissões">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="projections">Projeções</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="stat-card-accent">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Mensal</p>
                    <p className="text-2xl font-bold">R$ 127.500</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">+12.5%</span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Despesas</p>
                    <p className="text-2xl font-bold">R$ 92.000</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">+4.5%</span>
                    </div>
                  </div>
                  <TrendingDown className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                    <p className="text-2xl font-bold">R$ 35.500</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">+18.2%</span>
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">A Receber</p>
                    <p className="text-2xl font-bold">R$ 57.000</p>
                    <p className="text-sm text-muted-foreground mt-1">4 faturas</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Fluxo de Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowData}>
                      <defs>
                        <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip />
                      <Area type="monotone" dataKey="entrada" stroke="hsl(var(--accent))" fill="url(#colorEntrada)" strokeWidth={2} />
                      <Area type="monotone" dataKey="saida" stroke="hsl(var(--destructive))" fill="url(#colorSaida)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Próximos Recebimentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingPayments.map((payment, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{payment.company}</p>
                      <p className="text-xs text-muted-foreground">{payment.type} • {payment.dueDate}</p>
                    </div>
                    <p className="font-semibold text-sm">R$ {payment.value.toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comissões do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commissionsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Projeções de fluxo de caixa em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
