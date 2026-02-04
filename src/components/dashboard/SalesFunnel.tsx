import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelChart, Funnel, LabelList, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useSalesFunnel } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";

const stageColors: Record<string, string> = {
  lead: 'hsl(var(--chart-1))',
  qualified: 'hsl(var(--chart-2))',
  proposal: 'hsl(var(--chart-3))',
  negotiation: 'hsl(var(--chart-4))',
  closed_won: 'hsl(var(--success))',
  closed_lost: 'hsl(var(--destructive))',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.count} {data.count === 1 ? 'deal' : 'deals'}
        </p>
        <p className="text-sm text-muted-foreground">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalValue)}
        </p>
      </div>
    );
  }
  return null;
};

export function SalesFunnel() {
  const { data: funnelData, isLoading } = useSalesFunnel();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas</CardTitle>
          <CardDescription>Distribuição de deals por estágio</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = funnelData?.map((item) => ({
    ...item,
    fill: stageColors[item.stage] || 'hsl(var(--muted))',
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Vendas</CardTitle>
        <CardDescription>Distribuição de deals por estágio do pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState 
            variant="funnel" 
            title="Funil vazio"
            description="Adicione deals ao pipeline para visualizar o funil"
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip content={<CustomTooltip />} />
              <Funnel
                dataKey="count"
                data={chartData}
                isAnimationActive
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  position="right"
                  fill="hsl(var(--foreground))"
                  stroke="none"
                  dataKey="name"
                  className="text-sm"
                />
                <LabelList
                  position="center"
                  fill="white"
                  stroke="none"
                  dataKey="count"
                  className="text-sm font-bold"
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        )}
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {chartData.map((item) => (
            <div key={item.stage} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs text-muted-foreground">
                {item.name}: {item.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
