import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useTeamPerformance } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamPerformance() {
  const { role } = useAuth();
  const { data: team, isLoading } = useTeamPerformance();

  // Only show for admin
  if (role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Performance do Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasTeam = team && team.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Performance do Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTeam ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum membro da equipe encontrado</p>
          </div>
        ) : (
          team.map((member) => {
            const percentage = member.target > 0 ? (member.achieved / member.target) * 100 : 0;
            return (
              <div key={member.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {member.isLeads
                        ? `${member.achieved} leads`
                        : `R$ ${(member.achieved / 1000).toFixed(0)}k`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% da meta
                    </p>
                  </div>
                </div>
                <Progress value={Math.min(percentage, 100)} className="h-1.5" />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
