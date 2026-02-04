import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useRevenueChart } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function RevenueChart() {
  const { data, isLoading } = useRevenueChart();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Receita vs Projeção</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Use data from hook or fallback to empty
  const chartData = data && data.length > 0 ? data : [
    { month: "Jan", receita: 0, projecao: 0 },
    { month: "Fev", receita: 0, projecao: 0 },
    { month: "Mar", receita: 0, projecao: 0 },
    { month: "Abr", receita: 0, projecao: 0 },
    { month: "Mai", receita: 0, projecao: 0 },
    { month: "Jun", receita: 0, projecao: 0 },
  ];

  const hasData = chartData.some(d => d.receita > 0 || d.projecao > 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Receita vs Projeção</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Nenhum dado de receita disponível</p>
          </div>
        ) : (
          <>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="projecao"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProjecao)"
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReceita)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent" />
                <span className="text-sm text-muted-foreground">Receita Real</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary border-2 border-dashed border-primary" />
                <span className="text-sm text-muted-foreground">Projeção</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
