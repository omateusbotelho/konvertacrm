import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, Hash } from "lucide-react";
import { useSalesRanking } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const RankIcon = ({ position }: { position: number }) => {
  if (position === 1) return <Trophy className="h-5 w-5 text-chart-4" />;
  if (position === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (position === 3) return <Award className="h-5 w-5 text-chart-3" />;
  return <span className="w-5 text-center text-sm text-muted-foreground font-medium">{position}</span>;
};

interface RankingItemProps {
  position: number;
  name: string;
  initials: string;
  value: number;
  deals: number;
  isValue: boolean;
}

function RankingItem({ position, name, initials, value, deals, isValue }: RankingItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg transition-colors",
      position <= 3 ? "bg-muted/50" : "hover:bg-muted/30"
    )}>
      <div className="flex items-center justify-center w-8">
        <RankIcon position={position} />
      </div>
      
      <Avatar className="h-9 w-9">
        <AvatarFallback className={cn(
          position === 1 && "bg-chart-4/20 text-chart-4",
          position === 2 && "bg-muted text-muted-foreground",
          position === 3 && "bg-chart-3/20 text-chart-3",
          position > 3 && "bg-muted text-muted-foreground"
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          {deals} {deals === 1 ? 'deal' : 'deals'}
        </p>
      </div>
      
      <div className="text-right">
        <p className="font-semibold text-sm">
          {isValue ? formatCurrency(value) : value}
        </p>
      </div>
    </div>
  );
}

export function SalesRanking() {
  const [sortBy, setSortBy] = useState<'value' | 'count'>('value');
  const { data: ranking, isLoading } = useSalesRanking();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Vendedores</CardTitle>
          <CardDescription>Top performers do mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const closers = ranking?.closers || [];
  const sdrs = ranking?.sdrs || [];

  // Sort based on selected criteria
  const sortedClosers = [...closers].sort((a, b) => 
    sortBy === 'value' ? b.totalValue - a.totalValue : b.dealsCount - a.dealsCount
  );
  const sortedSdrs = [...sdrs].sort((a, b) => 
    sortBy === 'value' ? b.totalValue - a.totalValue : b.qualifiedCount - a.qualifiedCount
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ranking de Vendedores</CardTitle>
            <CardDescription>Top performers do mês atual</CardDescription>
          </div>
          <div className="flex gap-1">
            <Badge 
              variant={sortBy === 'value' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSortBy('value')}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Valor
            </Badge>
            <Badge 
              variant={sortBy === 'count' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSortBy('count')}
            >
              <Hash className="h-3 w-3 mr-1" />
              Qtd
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="closers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="closers">Closers</TabsTrigger>
            <TabsTrigger value="sdrs">SDRs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="closers" className="space-y-1">
            {sortedClosers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum closer com deals fechados este mês
              </p>
            ) : (
              sortedClosers.map((closer, index) => (
                <RankingItem
                  key={closer.id}
                  position={index + 1}
                  name={closer.name}
                  initials={closer.initials}
                  value={sortBy === 'value' ? closer.totalValue : closer.dealsCount}
                  deals={closer.dealsCount}
                  isValue={sortBy === 'value'}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="sdrs" className="space-y-1">
            {sortedSdrs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum SDR com leads qualificados este mês
              </p>
            ) : (
              sortedSdrs.map((sdr, index) => (
                <RankingItem
                  key={sdr.id}
                  position={index + 1}
                  name={sdr.name}
                  initials={sdr.initials}
                  value={sortBy === 'value' ? sdr.totalValue : sdr.qualifiedCount}
                  deals={sdr.qualifiedCount}
                  isValue={sortBy === 'value'}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
